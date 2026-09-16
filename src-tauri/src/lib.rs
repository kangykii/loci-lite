mod commands;

use tauri::Manager;
#[cfg(desktop)]
use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::file::get_notes_dir,
            commands::file::create_note,
            commands::file::read_file,
            commands::file::write_file,
            commands::file::delete_file,
            commands::file::duplicate_file,
            commands::file::reveal_file,
            commands::file::lookup_word,
            commands::extract::extract_pdf_text,
            commands::extract::extract_pdf_bytes,
            commands::extract::extract_url_text,
            commands::extract::extract_pasted_text,
            commands::atoms::create_atom,
            commands::atoms::get_atoms_for_file,
            commands::atoms::get_visible_atoms_for_file,
            commands::atoms::get_definition_atoms,
            commands::atoms::get_atom_by_id,
            commands::atoms::list_all_atoms,
            commands::atoms::list_due_unsurfaced_reminders,
            commands::atoms::get_atoms_by_group_label,
            commands::atoms::delete_atom,
            commands::atoms::update_atom,
            commands::atoms::update_atoms_group_label,
            commands::atoms::clear_singleton_group_label,
            commands::atoms::mark_reminders_surfaced,
            commands::files::insert_file,
            commands::files::get_file_by_id,
            commands::files::open_file,
            commands::files::touch_opened_at,
            commands::files::touch_edited_at,
            commands::files::update_title,
            commands::files::set_file_pinned,
            commands::files::update_files_project_group_label,
            commands::files::clear_singleton_project_group_label,
            commands::files::list_recent_files,
            commands::files::list_all_files,
            commands::files::list_files_by_edited_at,
            commands::files::delete_file_record,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = loci_core::pool::db_path_in(&app_data_dir);
            let pool = tauri::async_runtime::block_on(async {
                let pool = loci_core::pool::connect(&db_path).await?;
                loci_core::schema::ensure_schema(&pool).await?;
                Ok::<_, sqlx::Error>(pool)
            })
            .map_err(|error| Box::<dyn std::error::Error>::from(error.to_string()))?;
            app.manage(pool);

            #[cfg(desktop)]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(error) = install_update_if_available(handle).await {
                        eprintln!("update check failed: {error}");
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(desktop)]
async fn install_update_if_available(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        update.download_and_install(|_, _| {}, || {}).await?;
        app.restart();
    }
    Ok(())
}
