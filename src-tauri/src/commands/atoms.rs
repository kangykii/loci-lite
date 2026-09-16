use loci_core::atoms::{self, AtomRecord, AtomUpdate, NewAtom};
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn create_atom(pool: State<'_, SqlitePool>, input: NewAtom) -> Result<AtomRecord, String> {
    atoms::create_atom(&pool, input).await.map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_atoms_for_file(
    pool: State<'_, SqlitePool>,
    file_id: String,
) -> Result<Vec<AtomRecord>, String> {
    atoms::get_atoms_for_file(&pool, &file_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_visible_atoms_for_file(
    pool: State<'_, SqlitePool>,
    file_id: String,
) -> Result<Vec<AtomRecord>, String> {
    atoms::get_visible_atoms_for_file(&pool, &file_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_definition_atoms(pool: State<'_, SqlitePool>) -> Result<Vec<AtomRecord>, String> {
    atoms::get_definition_atoms(&pool)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_atom_by_id(
    pool: State<'_, SqlitePool>,
    id: String,
) -> Result<Option<AtomRecord>, String> {
    atoms::get_atom_by_id(&pool, &id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn list_all_atoms(pool: State<'_, SqlitePool>) -> Result<Vec<AtomRecord>, String> {
    atoms::list_all_atoms(&pool).await.map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn list_due_unsurfaced_reminders(
    pool: State<'_, SqlitePool>,
    now: i64,
) -> Result<Vec<AtomRecord>, String> {
    atoms::list_due_unsurfaced_reminders(&pool, now)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn get_atoms_by_group_label(
    pool: State<'_, SqlitePool>,
    group_label: String,
) -> Result<Vec<AtomRecord>, String> {
    atoms::get_atoms_by_group_label(&pool, &group_label)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn delete_atom(pool: State<'_, SqlitePool>, id: String) -> Result<(), String> {
    atoms::delete_atom(&pool, &id).await.map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn update_atom(
    pool: State<'_, SqlitePool>,
    id: String,
    patch: AtomUpdate,
) -> Result<AtomRecord, String> {
    atoms::update_atom(&pool, &id, patch)
        .await
        .map_err(|error| error.to_string())?
        .ok_or_else(|| format!("Atom {id} not found (it may have been deleted)."))
}

#[tauri::command]
pub async fn update_atoms_group_label(
    pool: State<'_, SqlitePool>,
    ids: Vec<String>,
    group_label: Option<String>,
) -> Result<(), String> {
    atoms::update_atoms_group_label(&pool, &ids, group_label.as_deref())
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn clear_singleton_group_label(
    pool: State<'_, SqlitePool>,
    group_label: String,
) -> Result<(), String> {
    atoms::clear_singleton_group_label(&pool, &group_label)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn mark_reminders_surfaced(
    pool: State<'_, SqlitePool>,
    ids: Vec<String>,
    surfaced_at: i64,
) -> Result<(), String> {
    atoms::mark_reminders_surfaced(&pool, &ids, surfaced_at)
        .await
        .map_err(|error| error.to_string())
}
