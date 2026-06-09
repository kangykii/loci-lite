use std::fs;

use std::path::{Path, PathBuf};



use tauri::{AppHandle, Manager};



fn notes_dir(app: &AppHandle) -> Result<PathBuf, String> {

    let base = app

        .path()

        .app_data_dir()

        .map_err(|error| error.to_string())?;

    let notes = base.join("notes");

    fs::create_dir_all(&notes).map_err(|error| error.to_string())?;

    Ok(notes)

}



fn slugify(slug: &str) -> String {

    let mut out = String::new();



    for character in slug.trim().to_lowercase().chars() {

        if character.is_ascii_alphanumeric() {

            out.push(character);

        } else if character == '-' {

            if !out.ends_with('-') {

                out.push('-');

            }

        } else if !out.is_empty() && !out.ends_with('-') {

            out.push('-');

        }

    }



    let trimmed = out.trim_matches('-');

    if trimmed.is_empty() {

        "untitled".to_string()

    } else {

        trimmed.chars().take(60).collect()

    }

}



fn unique_note_path(notes: &Path, slug: &str) -> Result<PathBuf, String> {

    let sanitized = slugify(slug);

    if sanitized.is_empty() {

        return Err("Slug must not be empty.".into());

    }



    let mut candidate = notes.join(format!("{sanitized}.md"));

    if !candidate.exists() {

        return Ok(candidate);

    }



    let mut suffix = 2;

    loop {

        candidate = notes.join(format!("{sanitized}-{suffix}.md"));

        if !candidate.exists() {

            return Ok(candidate);

        }

        suffix += 1;

    }

}



fn ensure_notes_path(app: &AppHandle, path: &str) -> Result<PathBuf, String> {

    let notes = notes_dir(app)?;

    let file_path = PathBuf::from(path);



    if !file_path.starts_with(&notes) {

        return Err("Path is outside the notes directory.".into());

    }



    Ok(file_path)

}



#[tauri::command]

pub fn get_notes_dir(app: AppHandle) -> Result<String, String> {

    notes_dir(&app).map(|path| path.to_string_lossy().into_owned())

}



#[tauri::command]

pub fn create_note(app: AppHandle, slug: String, initial_contents: String) -> Result<String, String> {

    let notes = notes_dir(&app)?;

    let path = unique_note_path(&notes, &slug)?;

    fs::write(&path, initial_contents).map_err(|error| error.to_string())?;

    Ok(path.to_string_lossy().into_owned())

}



#[tauri::command]

pub fn read_file(path: String) -> Result<String, String> {

    fs::read_to_string(path).map_err(|error| error.to_string())

}



#[tauri::command]

pub fn write_file(path: String, contents: String) -> Result<(), String> {

    let file_path = Path::new(&path);

    if let Some(parent) = file_path.parent() {

        fs::create_dir_all(parent).map_err(|error| error.to_string())?;

    }

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


