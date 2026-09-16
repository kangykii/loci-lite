use std::path::PathBuf;
use std::time::Duration;

use serde::Serialize;

const USER_AGENT: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

#[derive(Serialize)]
pub struct ExtractResult {
    pub title: Option<String>,
    pub text: String,
}

#[tauri::command]
pub fn extract_pdf_text(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    pdf_extract::extract_text(&path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn extract_pdf_bytes(bytes: Vec<u8>) -> Result<String, String> {
    pdf_extract::extract_text_from_mem(&bytes).map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn extract_url_text(url: String) -> Result<ExtractResult, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .user_agent(USER_AGENT)
        .build()
        .map_err(|error| error.to_string())?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Page request failed with status {}", response.status()));
    }

    let html = response.text().await.map_err(|error| error.to_string())?;

    Ok(ExtractResult {
        title: extract_title(&html),
        text: strip_html_to_text(&html),
    })
}

#[tauri::command]
pub fn extract_pasted_text(raw: String) -> ExtractResult {
    ExtractResult {
        title: extract_title(&raw),
        text: strip_html_to_text(&raw),
    }
}

const BLOCK_TAGS: [&str; 11] = [
    "br", "p", "div", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6",
];

fn extract_title(html: &str) -> Option<String> {
    let lower = html.to_lowercase();
    let tag_start = lower.find("<title")?;
    let content_start = lower[tag_start..].find('>')? + tag_start + 1;
    let content_end = lower[content_start..].find("</title>")? + content_start;

    let decoded = decode_entities(&html[content_start..content_end]);
    let collapsed = decoded.split_whitespace().collect::<Vec<_>>().join(" ");

    if collapsed.is_empty() {
        None
    } else {
        Some(collapsed)
    }
}

fn strip_html_to_text(html: &str) -> String {
    let mut output = String::new();
    let mut chars = html.chars().peekable();
    let mut skip_tag: Option<String> = None;

    while let Some(ch) = chars.next() {
        if ch != '<' {
            if skip_tag.is_none() {
                output.push(ch);
            }
            continue;
        }

        let tag = read_tag(&mut chars);
        let tag_lower = tag.to_lowercase();
        let is_closing = tag_lower.starts_with('/');
        let body = tag_lower
            .trim_start_matches('/')
            .trim_end_matches('/')
            .trim();
        let tag_name = body.split_whitespace().next().unwrap_or("").to_string();

        if let Some(name) = &skip_tag {
            if is_closing && &tag_name == name {
                skip_tag = None;
            }
            continue;
        }

        if tag_name == "script" || tag_name == "style" {
            if !is_closing {
                skip_tag = Some(tag_name);
            }
            continue;
        }

        if BLOCK_TAGS.contains(&tag_name.as_str()) {
            output.push('\n');
        }
    }

    collapse_whitespace(&decode_entities(&output))
}

/// Reads the contents of a `<...>` tag, honouring quoted attribute values so a
/// literal `>` inside e.g. a Tailwind arbitrary-variant class
/// (`data-x="[&>svg]:block"`) doesn't get mistaken for the tag's real close.
fn read_tag(chars: &mut std::iter::Peekable<std::str::Chars>) -> String {
    let mut tag = String::new();
    let mut quote: Option<char> = None;

    while let Some(&next) = chars.peek() {
        if let Some(q) = quote {
            tag.push(next);
            chars.next();
            if next == q {
                quote = None;
            }
            continue;
        }

        match next {
            '"' | '\'' => {
                quote = Some(next);
                tag.push(next);
                chars.next();
            }
            '>' => {
                chars.next();
                break;
            }
            _ => {
                tag.push(next);
                chars.next();
            }
        }
    }

    tag
}

fn decode_entities(input: &str) -> String {
    input
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
}

fn collapse_whitespace(input: &str) -> String {
    let mut result = String::new();
    let mut blank_run = 0;

    for raw_line in input.lines() {
        let collapsed = raw_line.split_whitespace().collect::<Vec<_>>().join(" ");

        if collapsed.is_empty() {
            blank_run += 1;
            if blank_run > 1 {
                continue;
            }
        } else {
            blank_run = 0;
        }

        result.push_str(&collapsed);
        result.push('\n');
    }

    result.trim().to_string()
}
