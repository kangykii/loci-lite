mod commands;

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

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
        .invoke_handler(tauri::generate_handler![
            commands::file::get_notes_dir,
            commands::file::create_note,
            commands::file::read_file,
            commands::file::write_file,
            commands::file::delete_file,
        ])
        .setup(|app| {
            #[cfg(target_os = "windows")]
            if let Some(window) = app.get_webview_window("main") {
                window.set_decorations(false)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
