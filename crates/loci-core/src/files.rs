use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

/// JSON shape (camelCase) matches `FileRecord` in `src/store/files.store.ts` exactly.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct FileRecord {
    pub id: String,
    pub path: String,
    pub title: Option<String>,
    pub opened_at: i64,
    pub created_at: i64,
    pub edited_at: i64,
    pub pinned: bool,
    pub project_group_label: Option<String>,
}

const FILE_COLUMNS: &str =
    "id, path, title, opened_at, created_at, edited_at, pinned, project_group_label";

/// Persists a fully-formed record as-is - unlike atoms, files carry no server-side
/// defaulting today, so this mirrors the old `insertFile(record): Promise<void>`
/// contract exactly (callers already generate id/timestamps themselves).
pub async fn insert_file(pool: &SqlitePool, record: &FileRecord) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO files (id, path, title, opened_at, created_at, edited_at, pinned, \
         project_group_label) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
    )
    .bind(&record.id)
    .bind(&record.path)
    .bind(&record.title)
    .bind(record.opened_at)
    .bind(record.created_at)
    .bind(record.edited_at)
    .bind(record.pinned)
    .bind(&record.project_group_label)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_file_by_id(
    pool: &SqlitePool,
    id: &str,
) -> Result<Option<FileRecord>, sqlx::Error> {
    let sql = format!("SELECT {FILE_COLUMNS} FROM files WHERE id = ?1");
    sqlx::query_as::<_, FileRecord>(&sql)
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn touch_opened_at(pool: &SqlitePool, id: &str, opened_at: i64) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE files SET opened_at = ?1 WHERE id = ?2")
        .bind(opened_at)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn touch_edited_at(pool: &SqlitePool, id: &str, edited_at: i64) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE files SET edited_at = ?1 WHERE id = ?2")
        .bind(edited_at)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_title(
    pool: &SqlitePool,
    id: &str,
    title: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE files SET title = ?1 WHERE id = ?2")
        .bind(title)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_file_pinned(pool: &SqlitePool, id: &str, pinned: bool) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE files SET pinned = ?1 WHERE id = ?2")
        .bind(pinned)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_files_project_group_label(
    pool: &SqlitePool,
    ids: &[String],
    project_group_label: Option<&str>,
) -> Result<(), sqlx::Error> {
    if ids.is_empty() {
        return Ok(());
    }

    let placeholders = (1..=ids.len()).map(|i| format!("?{}", i + 1)).collect::<Vec<_>>().join(", ");
    let sql = format!("UPDATE files SET project_group_label = ?1 WHERE id IN ({placeholders})");
    let mut query = sqlx::query(&sql).bind(project_group_label);
    for id in ids {
        query = query.bind(id);
    }
    query.execute(pool).await?;
    Ok(())
}

pub async fn clear_singleton_project_group_label(
    pool: &SqlitePool,
    group_label: &str,
) -> Result<(), sqlx::Error> {
    let ids: Vec<(String,)> =
        sqlx::query_as("SELECT id FROM files WHERE project_group_label = ?1")
            .bind(group_label)
            .fetch_all(pool)
            .await?;

    if ids.len() == 1 {
        sqlx::query("UPDATE files SET project_group_label = NULL WHERE id = ?1")
            .bind(&ids[0].0)
            .execute(pool)
            .await?;
    }
    Ok(())
}

pub async fn list_recent_files(pool: &SqlitePool, limit: i64) -> Result<Vec<FileRecord>, sqlx::Error> {
    let sql = format!("SELECT {FILE_COLUMNS} FROM files ORDER BY pinned DESC, opened_at DESC LIMIT ?1");
    sqlx::query_as::<_, FileRecord>(&sql)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn list_all_files(pool: &SqlitePool) -> Result<Vec<FileRecord>, sqlx::Error> {
    let sql = format!("SELECT {FILE_COLUMNS} FROM files ORDER BY pinned DESC, opened_at DESC");
    sqlx::query_as::<_, FileRecord>(&sql).fetch_all(pool).await
}

pub async fn list_files_by_edited_at(pool: &SqlitePool) -> Result<Vec<FileRecord>, sqlx::Error> {
    let sql = format!("SELECT {FILE_COLUMNS} FROM files ORDER BY edited_at DESC");
    sqlx::query_as::<_, FileRecord>(&sql).fetch_all(pool).await
}

pub async fn delete_file(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM files WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
