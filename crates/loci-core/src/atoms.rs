use std::time::{SystemTime, UNIX_EPOCH};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

/// A bookmark. JSON shape (camelCase, `type` field) matches `AtomRecord` in
/// `src/lib/atomTypes.ts` exactly, so Tauri commands can return this directly with
/// no mapping layer on the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AtomRecord {
    pub id: String,
    pub file_id: String,
    #[serde(rename = "type")]
    pub atom_type: String,
    pub question: String,
    pub answer: String,
    pub source_text: String,
    pub group_label: Option<String>,
    pub span_start: Option<i64>,
    pub span_end: Option<i64>,
    pub reminder_due_at: Option<i64>,
    pub reminder_surfaced_at: Option<i64>,
    pub created_at: i64,
}

const ATOM_COLUMNS: &str = "id, file_id, type AS atom_type, question, answer, source_text, \
    group_label, span_start, span_end, reminder_due_at, reminder_surfaced_at, created_at";

/// What a caller supplies to create a bookmark; matches `CreateAtomInput` in
/// `src/lib/atomTypes.ts`. Id/`createdAt`/`question`/reminder-field defaulting -
/// previously `buildAtomRecord()` in `src/lib/atomRecord.ts` - happens here, once,
/// so every caller (the app's Tauri commands and loci-mcp's MCP tools) gets
/// identical behavior instead of two implementations that can drift apart.
#[derive(Debug, Clone, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct NewAtom {
    pub file_id: String,
    #[serde(rename = "type")]
    pub atom_type: String,
    pub source_text: String,
    pub answer: String,
    pub span_start: Option<i64>,
    pub span_end: Option<i64>,
    #[serde(default)]
    pub reminder_due_at: Option<i64>,
    /// Caller-supplied id (the frontend still generates one for optimistic UI);
    /// a fresh UUID v4 is assigned when absent (e.g. a direct MCP tool call).
    #[serde(default)]
    pub id: Option<String>,
}

/// Matches the `patch` shape `updateAtom` took in `src/store/atoms.store.ts`.
#[derive(Debug, Clone, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct AtomUpdate {
    #[serde(rename = "type")]
    pub atom_type: String,
    pub answer: String,
    #[serde(default)]
    pub source_text: Option<String>,
    #[serde(default)]
    pub reminder_due_at: Option<i64>,
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock before unix epoch")
        .as_millis() as i64
}

pub async fn create_atom(pool: &SqlitePool, input: NewAtom) -> Result<AtomRecord, sqlx::Error> {
    let id = input.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let source_text = input.source_text.trim().to_string();
    let answer = input.answer.trim().to_string();
    let reminder_due_at = if input.atom_type == "reminder" {
        input.reminder_due_at
    } else {
        None
    };
    let created_at = now_millis();

    sqlx::query(
        "INSERT INTO atoms (id, file_id, type, question, answer, source_text, group_label, \
         span_start, span_end, reminder_due_at, reminder_surfaced_at, created_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, ?8, ?9, NULL, ?10)",
    )
    .bind(&id)
    .bind(&input.file_id)
    .bind(&input.atom_type)
    .bind(&source_text)
    .bind(&answer)
    .bind(&source_text)
    .bind(input.span_start)
    .bind(input.span_end)
    .bind(reminder_due_at)
    .bind(created_at)
    .execute(pool)
    .await?;

    Ok(get_atom_by_id(pool, &id)
        .await?
        .expect("row was just inserted"))
}

pub async fn get_atoms_for_file(
    pool: &SqlitePool,
    file_id: &str,
) -> Result<Vec<AtomRecord>, sqlx::Error> {
    let sql = format!("SELECT {ATOM_COLUMNS} FROM atoms WHERE file_id = ?1 ORDER BY created_at DESC");
    sqlx::query_as::<_, AtomRecord>(&sql)
        .bind(file_id)
        .fetch_all(pool)
        .await
}

pub async fn get_visible_atoms_for_file(
    pool: &SqlitePool,
    file_id: &str,
) -> Result<Vec<AtomRecord>, sqlx::Error> {
    let sql = format!(
        "SELECT {ATOM_COLUMNS} FROM atoms WHERE file_id = ?1 \
         AND type IN ('definition', 'note', 'reminder') ORDER BY created_at DESC"
    );
    sqlx::query_as::<_, AtomRecord>(&sql)
        .bind(file_id)
        .fetch_all(pool)
        .await
}

pub async fn get_definition_atoms(pool: &SqlitePool) -> Result<Vec<AtomRecord>, sqlx::Error> {
    let sql = format!("SELECT {ATOM_COLUMNS} FROM atoms WHERE type = 'definition' ORDER BY created_at DESC");
    sqlx::query_as::<_, AtomRecord>(&sql).fetch_all(pool).await
}

pub async fn get_atom_by_id(
    pool: &SqlitePool,
    id: &str,
) -> Result<Option<AtomRecord>, sqlx::Error> {
    let sql = format!("SELECT {ATOM_COLUMNS} FROM atoms WHERE id = ?1");
    sqlx::query_as::<_, AtomRecord>(&sql)
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn list_all_atoms(pool: &SqlitePool) -> Result<Vec<AtomRecord>, sqlx::Error> {
    let sql = format!("SELECT {ATOM_COLUMNS} FROM atoms ORDER BY created_at DESC");
    sqlx::query_as::<_, AtomRecord>(&sql).fetch_all(pool).await
}

pub async fn list_due_unsurfaced_reminders(
    pool: &SqlitePool,
    now: i64,
) -> Result<Vec<AtomRecord>, sqlx::Error> {
    let sql = format!(
        "SELECT {ATOM_COLUMNS} FROM atoms WHERE type = 'reminder' AND reminder_due_at IS NOT NULL \
         AND reminder_due_at <= ?1 AND reminder_surfaced_at IS NULL ORDER BY reminder_due_at ASC"
    );
    sqlx::query_as::<_, AtomRecord>(&sql)
        .bind(now)
        .fetch_all(pool)
        .await
}

pub async fn get_atoms_by_group_label(
    pool: &SqlitePool,
    group_label: &str,
) -> Result<Vec<AtomRecord>, sqlx::Error> {
    let sql = format!("SELECT {ATOM_COLUMNS} FROM atoms WHERE group_label = ?1 ORDER BY created_at ASC");
    sqlx::query_as::<_, AtomRecord>(&sql)
        .bind(group_label)
        .fetch_all(pool)
        .await
}

/// Every filter is optional and composes - the general-purpose read MCP tools use
/// this; there's no single equivalent in the old TS store (which only ever
/// exposed fixed combinations like `getVisibleAtomsForFile`/`getDefinitionAtoms`).
pub async fn list_atoms(
    pool: &SqlitePool,
    file_id: Option<&str>,
    atom_type: Option<&str>,
) -> Result<Vec<AtomRecord>, sqlx::Error> {
    let sql = format!(
        "SELECT {ATOM_COLUMNS} FROM atoms WHERE (?1 IS NULL OR file_id = ?1) \
         AND (?2 IS NULL OR type = ?2) ORDER BY created_at DESC"
    );
    sqlx::query_as::<_, AtomRecord>(&sql)
        .bind(file_id)
        .bind(atom_type)
        .fetch_all(pool)
        .await
}

pub async fn search_atoms(
    pool: &SqlitePool,
    query: &str,
) -> Result<Vec<AtomRecord>, sqlx::Error> {
    let like = format!("%{query}%");
    let sql = format!(
        "SELECT {ATOM_COLUMNS} FROM atoms WHERE question LIKE ?1 OR answer LIKE ?1 \
         OR source_text LIKE ?1 ORDER BY created_at DESC"
    );
    sqlx::query_as::<_, AtomRecord>(&sql)
        .bind(&like)
        .fetch_all(pool)
        .await
}

pub async fn delete_atom(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM atoms WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

/// `Ok(None)` means no atom with this id exists - either it never did, or another
/// writer (the app, or a concurrent MCP call) deleted it between this update and
/// the read-back. Two processes can hold connections to the same file at once, so
/// this is a real, reachable outcome, not just a defensive check.
pub async fn update_atom(
    pool: &SqlitePool,
    id: &str,
    patch: AtomUpdate,
) -> Result<Option<AtomRecord>, sqlx::Error> {
    let answer = patch.answer.trim().to_string();
    let reminder_due_at = if patch.atom_type == "reminder" {
        patch.reminder_due_at
    } else {
        None
    };

    if let Some(source_text) = patch.source_text {
        let source_text = source_text.trim().to_string();
        sqlx::query(
            "UPDATE atoms SET type = ?1, answer = ?2, question = ?3, source_text = ?4, \
             reminder_due_at = ?5, reminder_surfaced_at = NULL WHERE id = ?6",
        )
        .bind(&patch.atom_type)
        .bind(&answer)
        .bind(&source_text)
        .bind(&source_text)
        .bind(reminder_due_at)
        .bind(id)
        .execute(pool)
        .await?;
    } else {
        sqlx::query(
            "UPDATE atoms SET type = ?1, answer = ?2, reminder_due_at = ?3, \
             reminder_surfaced_at = NULL WHERE id = ?4",
        )
        .bind(&patch.atom_type)
        .bind(&answer)
        .bind(reminder_due_at)
        .bind(id)
        .execute(pool)
        .await?;
    }

    get_atom_by_id(pool, id).await
}

pub async fn update_atoms_group_label(
    pool: &SqlitePool,
    ids: &[String],
    group_label: Option<&str>,
) -> Result<(), sqlx::Error> {
    if ids.is_empty() {
        return Ok(());
    }

    let placeholders = (1..=ids.len()).map(|i| format!("?{}", i + 1)).collect::<Vec<_>>().join(", ");
    let sql = format!("UPDATE atoms SET group_label = ?1 WHERE id IN ({placeholders})");
    let mut query = sqlx::query(&sql).bind(group_label);
    for id in ids {
        query = query.bind(id);
    }
    query.execute(pool).await?;
    Ok(())
}

pub async fn clear_singleton_group_label(
    pool: &SqlitePool,
    group_label: &str,
) -> Result<(), sqlx::Error> {
    let ids: Vec<(String,)> = sqlx::query_as("SELECT id FROM atoms WHERE group_label = ?1")
        .bind(group_label)
        .fetch_all(pool)
        .await?;

    if ids.len() == 1 {
        sqlx::query("UPDATE atoms SET group_label = NULL WHERE id = ?1")
            .bind(&ids[0].0)
            .execute(pool)
            .await?;
    }
    Ok(())
}

pub async fn mark_reminders_surfaced(
    pool: &SqlitePool,
    ids: &[String],
    surfaced_at: i64,
) -> Result<(), sqlx::Error> {
    if ids.is_empty() {
        return Ok(());
    }

    let placeholders = (1..=ids.len()).map(|i| format!("?{}", i + 1)).collect::<Vec<_>>().join(", ");
    let sql = format!("UPDATE atoms SET reminder_surfaced_at = ?1 WHERE id IN ({placeholders})");
    let mut query = sqlx::query(&sql).bind(surfaced_at);
    for id in ids {
        query = query.bind(id);
    }
    query.execute(pool).await?;
    Ok(())
}
