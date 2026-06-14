use std::fs;
use std::process::Command;

use tauri::AppHandle;

use super::note_paths::{ensure_notes_path, notes_dir, unique_note_path};

#[tauri::command]

pub fn get_notes_dir(app: AppHandle) -> Result<String, String> {
    notes_dir(&app).map(|path| path.to_string_lossy().into_owned())
}

#[tauri::command]

pub fn create_note(
    app: AppHandle,
    slug: String,
    initial_contents: String,
) -> Result<String, String> {
    let notes = notes_dir(&app)?;

    let path = unique_note_path(&notes, &slug)?;

    fs::write(&path, initial_contents).map_err(|error| error.to_string())?;

    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]

pub fn read_file(app: AppHandle, path: String) -> Result<String, String> {
    let file_path = ensure_notes_path(&app, &path)?;
    fs::read_to_string(file_path).map_err(|error| error.to_string())
}

#[tauri::command]

pub fn write_file(app: AppHandle, path: String, contents: String) -> Result<(), String> {
    let file_path = ensure_notes_path(&app, &path)?;
    fs::write(file_path, contents).map_err(|error| error.to_string())
}

#[tauri::command]

pub fn delete_file(app: AppHandle, path: String) -> Result<(), String> {
    let file_path = ensure_notes_path(&app, &path)?;

    if !file_path.exists() {
        return Err("File not found.".into());
    }

    fs::remove_file(file_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn duplicate_file(app: AppHandle, path: String) -> Result<String, String> {
    let source = ensure_notes_path(&app, &path)?;
    if !source.exists() {
        return Err("File not found.".into());
    }

    let notes = notes_dir(&app)?;
    let stem = source
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("untitled");
    let target = unique_note_path(&notes, &format!("{stem}-copy"))?;
    fs::copy(&source, &target).map_err(|error| error.to_string())?;
    Ok(target.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn reveal_file(app: AppHandle, path: String) -> Result<(), String> {
    let file_path = ensure_notes_path(&app, &path)?;
    if !file_path.exists() {
        return Err("File not found.".into());
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(format!("/select,{}", file_path.to_string_lossy()))
            .spawn()
            .map_err(|error| error.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&file_path)
            .spawn()
            .map_err(|error| error.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        let parent = file_path.parent().ok_or("File has no parent directory.")?;
        open::that(parent).map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn lookup_word(text: String) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        let word = text.trim();
        if word.is_empty() {
            return Ok(false);
        }
        open::that(format!("dict://{word}")).map_err(|error| error.to_string())?;
        return Ok(true);
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = text;
        Ok(false)
    }
}
