use sqlx::{Row, SqlitePool};

/// Creates/migrates the `files` and `atoms` tables. Rust-native port of the
/// `files`/`atoms` portion of `ensureSchema()` in `src/store/db.ts` - this crate is
/// now the sole owner of those two tables' schema; `db.ts` keeps `settings` and
/// `onboarding`. Idempotent (safe to call on every startup, from either process).
pub async fn ensure_schema(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            path TEXT NOT NULL UNIQUE,
            title TEXT,
            opened_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS atoms (
            id TEXT PRIMARY KEY,
            file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            source_text TEXT NOT NULL,
            group_label TEXT,
            span_start INTEGER,
            span_end INTEGER,
            created_at INTEGER NOT NULL
        )",
    )
    .execute(pool)
    .await?;

    add_column_if_missing(
        pool,
        "atoms",
        "type",
        "type TEXT NOT NULL DEFAULT 'note' CHECK(type IN ('definition', 'note', 'reminder'))",
    )
    .await?;
    add_column_if_missing(pool, "files", "edited_at", "edited_at INTEGER NOT NULL DEFAULT 0")
        .await?;
    sqlx::query("UPDATE files SET edited_at = opened_at WHERE edited_at = 0")
        .execute(pool)
        .await?;
    add_column_if_missing(pool, "files", "pinned", "pinned INTEGER NOT NULL DEFAULT 0").await?;
    add_column_if_missing(pool, "files", "project_group_label", "project_group_label TEXT")
        .await?;
    add_column_if_missing(pool, "atoms", "reminder_due_at", "reminder_due_at INTEGER").await?;
    add_column_if_missing(pool, "atoms", "reminder_surfaced_at", "reminder_surfaced_at INTEGER")
        .await?;

    Ok(())
}

async fn table_has_column(
    pool: &SqlitePool,
    table: &str,
    column: &str,
) -> Result<bool, sqlx::Error> {
    let rows = sqlx::query(&format!("PRAGMA table_info({table})"))
        .fetch_all(pool)
        .await?;
    Ok(rows.iter().any(|row| {
        let name: String = row.get("name");
        name == column
    }))
}

async fn add_column_if_missing(
    pool: &SqlitePool,
    table: &str,
    column: &str,
    definition: &str,
) -> Result<(), sqlx::Error> {
    if table_has_column(pool, table, column).await? {
        return Ok(());
    }

    sqlx::query(&format!("ALTER TABLE {table} ADD COLUMN {definition}"))
        .execute(pool)
        .await?;
    Ok(())
}
