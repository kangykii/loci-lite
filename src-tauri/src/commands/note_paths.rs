use std::fs;
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

pub(crate) fn notes_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    let notes = base.join("notes");
    fs::create_dir_all(&notes).map_err(|error| error.to_string())?;
    Ok(notes)
}

fn canonical_notes_dir(app: &AppHandle) -> Result<PathBuf, String> {
    notes_dir(app)?
        .canonicalize()
        .map_err(|error| error.to_string())
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

pub(crate) fn unique_note_path(notes: &Path, slug: &str) -> Result<PathBuf, String> {
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

pub(crate) fn ensure_notes_path(app: &AppHandle, path: &str) -> Result<PathBuf, String> {
    let notes = canonical_notes_dir(app)?;
    let file_path = PathBuf::from(path);
    let extension = file_path.extension().and_then(|value| value.to_str());

    if extension != Some("md") {
        return Err("Only Markdown note files are allowed.".into());
    }

    let checked_path = if file_path.exists() {
        file_path
            .canonicalize()
            .map_err(|error| error.to_string())?
    } else {
        let parent = file_path
            .parent()
            .ok_or("File path has no parent directory.")?
            .canonicalize()
            .map_err(|error| error.to_string())?;
        let file_name = file_path.file_name().ok_or("File path has no name.")?;
        parent.join(file_name)
    };

    if !checked_path.starts_with(&notes) {
        return Err("Path is outside the notes directory.".into());
    }

    Ok(checked_path)
}
