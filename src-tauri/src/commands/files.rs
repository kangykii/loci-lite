use loci_core::files::{self, FileRecord};
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn insert_file(pool: State<'_, SqlitePool>, record: FileRecord) -> Result<(), String> {
    files::insert_file(&pool, &record)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_file_by_id(
    pool: State<'_, SqlitePool>,
    id: String,
) -> Result<Option<FileRecord>, String> {
    files::get_file_by_id(&pool, &id)
        .await
        .map_err(|error| error.to_string())
}

/// Combines `get_file_by_id` + `touch_opened_at` into one IPC round trip for the
/// note-open hot path. The opened_at write happens off the response path (spawned,
/// not awaited) since the caller only needs the record to render — the timestamp
/// bump has no bearing on what gets displayed.
#[tauri::command]
pub async fn open_file(
    pool: State<'_, SqlitePool>,
    id: String,
    opened_at: i64,
) -> Result<Option<FileRecord>, String> {
    let record = files::get_file_by_id(&pool, &id)
        .await
        .map_err(|error| error.to_string())?;

    if record.is_some() {
        let pool = pool.inner().clone();
        let touch_id = id.clone();
        tauri::async_runtime::spawn(async move {
            let _ = files::touch_opened_at(&pool, &touch_id, opened_at).await;
        });
    }

    Ok(record)
}

#[tauri::command]
pub async fn touch_opened_at(
    pool: State<'_, SqlitePool>,
    id: String,
    opened_at: i64,
) -> Result<(), String> {
    files::touch_opened_at(&pool, &id, opened_at)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn touch_edited_at(
    pool: State<'_, SqlitePool>,
    id: String,
    edited_at: i64,
) -> Result<(), String> {
    files::touch_edited_at(&pool, &id, edited_at)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn update_title(
    pool: State<'_, SqlitePool>,
    id: String,
    title: Option<String>,
) -> Result<(), String> {
    files::update_title(&pool, &id, title.as_deref())
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn set_file_pinned(
    pool: State<'_, SqlitePool>,
    id: String,
    pinned: bool,
) -> Result<(), String> {
    files::set_file_pinned(&pool, &id, pinned)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn update_files_project_group_label(
    pool: State<'_, SqlitePool>,
    ids: Vec<String>,
    project_group_label: Option<String>,
) -> Result<(), String> {
    files::update_files_project_group_label(&pool, &ids, project_group_label.as_deref())
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn clear_singleton_project_group_label(
    pool: State<'_, SqlitePool>,
    group_label: String,
) -> Result<(), String> {
    files::clear_singleton_project_group_label(&pool, &group_label)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn list_recent_files(
    pool: State<'_, SqlitePool>,
    limit: i64,
) -> Result<Vec<FileRecord>, String> {
    files::list_recent_files(&pool, limit)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn list_all_files(pool: State<'_, SqlitePool>) -> Result<Vec<FileRecord>, String> {
    files::list_all_files(&pool).await.map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn list_files_by_edited_at(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<FileRecord>, String> {
    files::list_files_by_edited_at(&pool)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn delete_file_record(pool: State<'_, SqlitePool>, id: String) -> Result<(), String> {
    files::delete_file(&pool, &id).await.map_err(|error| error.to_string())
}
