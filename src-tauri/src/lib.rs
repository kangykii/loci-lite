mod commands;

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
#[cfg(desktop)]
use tauri_plugin_updater::UpdaterExt;

const DB_URI: &str = "sqlite:loci.db";

fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../../src/store/migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "atom_type",
            sql: include_str!("../../src/store/migrations/002_atom_type.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "file_edited_at",
            sql: include_str!("../../src/store/migrations/003_file_edited_at.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "onboarding",
            sql: include_str!("../../src/store/migrations/004_onboarding.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB_URI, migrations())
                .build(),
        )
        .plugin(tauri_plugin_oauth::init())
        .invoke_handler(tauri::generate_handler![
            commands::file::get_notes_dir,
            commands::file::create_note,
            commands::file::read_file,
            commands::file::write_file,
            commands::file::delete_file,
            commands::window::open_url,
            commands::window::wait_for_local_callback,
            commands::window::wait_for_oauth_callback,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            #[cfg(target_os = "windows")]
            if let Some(window) = app.get_webview_window("main") {
                window.set_decorations(false)?;
            }

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
