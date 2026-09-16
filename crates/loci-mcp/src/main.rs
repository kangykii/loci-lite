mod tools;

use std::path::PathBuf;

use rmcp::ServiceExt;
use tools::LociMcp;

/// Matches `app.path().app_data_dir()` for identifier `app.loci.lite` (see
/// `src-tauri/src/commands/note_paths.rs`) - on Windows, `%APPDATA%\app.loci.lite`.
fn default_db_path() -> PathBuf {
    let app_data = std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));
    loci_core::pool::db_path_in(&app_data.join("app.loci.lite"))
}

fn resolve_db_path() -> PathBuf {
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        if arg == "--db-path" {
            if let Some(path) = args.next() {
                return PathBuf::from(path);
            }
        } else if let Some(path) = arg.strip_prefix("--db-path=") {
            return PathBuf::from(path);
        }
    }
    if let Some(path) = std::env::var_os("LOCI_DB_PATH") {
        return PathBuf::from(path);
    }
    default_db_path()
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db_path = resolve_db_path();
    eprintln!("loci-mcp: reading {}", db_path.display());

    let pool = loci_core::pool::connect(&db_path).await?;
    loci_core::schema::ensure_schema(&pool).await?;

    let service = LociMcp::new(pool).serve(rmcp::transport::stdio()).await?;
    service.waiting().await?;
    Ok(())
}
