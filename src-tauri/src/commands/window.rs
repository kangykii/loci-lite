use std::borrow::Cow;
use std::sync::mpsc::sync_channel;

use tauri_plugin_oauth::OauthConfig;

#[tauri::command]
pub async fn open_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn wait_for_oauth_callback(port: u16) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let (tx, rx) = sync_channel::<String>(1);
        let config = OauthConfig {
            ports: Some(vec![port]),
            response: Some(Cow::Borrowed(
                "<html><body>Sign-in complete. You can close this window.</body></html>",
            )),
        };

        tauri_plugin_oauth::start_with_config(config, move |url| {
            let _ = tx.send(url);
        })
        .map_err(|e| e.to_string())?;

        rx.recv().map_err(|_| "OAuth callback not received".to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
