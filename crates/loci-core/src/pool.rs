use std::path::Path;
use std::time::Duration;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::SqlitePool;

/// Opens a pool against `db_path` with WAL journaling and a busy-timeout, so the
/// Tauri app and a separately-running `loci-mcp` process can both hold connections
/// open to the same file without `SQLITE_BUSY` errors under normal use.
pub async fn connect(db_path: &Path) -> Result<SqlitePool, sqlx::Error> {
    let options = SqliteConnectOptions::new()
        .filename(db_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .busy_timeout(Duration::from_secs(5));

    SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
}

/// `loci.db` sitting directly under the app's data directory - matches how
/// `tauri-plugin-sql` resolves the relative `sqlite:loci.db` URL the frontend uses
/// for its own (non-atoms/files) tables, so both land on the same physical file.
pub fn db_path_in(app_data_dir: &Path) -> std::path::PathBuf {
    app_data_dir.join("loci.db")
}
