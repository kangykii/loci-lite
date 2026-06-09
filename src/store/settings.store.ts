import {
  type EditorFontChoice,
  parseEditorFontChoice,
} from '../lib/editorFont';
import { getDb } from './db';

const TYPEWRITER_SOUND_KEY = 'typewriter_sound';
const SEED_DOCS_FLAG_KEY = 'seed.docs_v1';
const OPENAI_API_KEY_KEY = 'ai.openai_key';
const AI_WELCOME_BATCH_KEY = 'ai.welcome_batch';
const AI_WELCOME_INDEX_KEY = 'ai.welcome_index';
const AI_WELCOME_SOURCE_FILE_ID_KEY = 'ai.welcome_source_file_id';
const FONT_SIZE_KEY_PREFIX = 'font_size_';
const EDITOR_DEFAULT_FONT_KEY = 'editor_default_font';
const EDITOR_DEFAULT_FONT_SIZE_KEY = 'editor_default_font_size';
const EDITOR_DEFAULT_FOCUS_MODE_KEY = 'editor_default_focus_mode';
const EDITOR_DEFAULT_AUTHORSHIP_KEY = 'editor_default_authorship';
const EDITOR_DEFAULT_BOOKMARK_HIGHLIGHT_KEY = 'editor_default_bookmark_highlight';
const DOCUMENT_SCROLL_KEY_PREFIX = 'document_scroll_';

export const EDITOR_FONT_SIZE_MIN = 14;
export const EDITOR_FONT_SIZE_MAX = 24;
export const EDITOR_FONT_SIZE_DEFAULT = 17;

function parseFontSize(value: string | undefined): number | null {
  if (!value) return null;

  const size = Number.parseInt(value, 10);
  if (!Number.isFinite(size)) return null;
  if (size < EDITOR_FONT_SIZE_MIN || size > EDITOR_FONT_SIZE_MAX) return null;

  return size;
}

export type SettingRecord = {
  key: string;
  value: string;
};

export async function listSettings(): Promise<SettingRecord[]> {
  return [];
}

async function getStringSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [key],
  );

  return rows[0]?.value ?? null;
}

async function setStringSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [key, value],
  );
}

export async function getOpenAIKey(): Promise<string> {
  return (await getStringSetting(OPENAI_API_KEY_KEY)) ?? '';
}

export async function setOpenAIKey(apiKey: string): Promise<void> {
  await setStringSetting(OPENAI_API_KEY_KEY, apiKey.trim());
}

export type AiWelcomeCache = {
  messages: string[];
  index: number;
  sourceFileId: string | null;
};

export async function getAiWelcomeCache(): Promise<AiWelcomeCache> {
  const [batchJson, indexValue, sourceFileId] = await Promise.all([
    getStringSetting(AI_WELCOME_BATCH_KEY),
    getStringSetting(AI_WELCOME_INDEX_KEY),
    getStringSetting(AI_WELCOME_SOURCE_FILE_ID_KEY),
  ]);

  let messages: string[] = [];
  if (batchJson) {
    try {
      const parsed = JSON.parse(batchJson);
      if (Array.isArray(parsed)) {
        messages = parsed.filter((message): message is string => typeof message === 'string');
      }
    } catch {
      messages = [];
    }
  }

  const parsedIndex = Number.parseInt(indexValue ?? '', 10);

  return {
    messages,
    index: Number.isFinite(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 0,
    sourceFileId: sourceFileId || null,
  };
}

export async function setAiWelcomeCache(cache: AiWelcomeCache): Promise<void> {
  const boundedIndex = Math.max(0, Math.min(cache.index, cache.messages.length));

  await Promise.all([
    setStringSetting(AI_WELCOME_BATCH_KEY, JSON.stringify(cache.messages)),
    setStringSetting(AI_WELCOME_INDEX_KEY, String(boundedIndex)),
    setStringSetting(AI_WELCOME_SOURCE_FILE_ID_KEY, cache.sourceFileId ?? ''),
  ]);
}

export async function getTypewriterSound(): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [TYPEWRITER_SOUND_KEY],
  );

  return rows[0]?.value === 'true';
}

export async function setTypewriterSound(enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [TYPEWRITER_SOUND_KEY, String(enabled)],
  );
}

async function getBooleanSetting(key: string, defaultValue: boolean): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [key],
  );

  if (!rows[0]) return defaultValue;

  return rows[0].value === 'true';
}

async function setBooleanSetting(key: string, enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [key, String(enabled)],
  );
}

export async function getDefaultFocusMode(): Promise<boolean> {
  return getBooleanSetting(EDITOR_DEFAULT_FOCUS_MODE_KEY, false);
}

export async function setDefaultFocusMode(enabled: boolean): Promise<void> {
  await setBooleanSetting(EDITOR_DEFAULT_FOCUS_MODE_KEY, enabled);
}

export async function getDefaultAuthorship(): Promise<boolean> {
  return getBooleanSetting(EDITOR_DEFAULT_AUTHORSHIP_KEY, false);
}

export async function setDefaultAuthorship(enabled: boolean): Promise<void> {
  await setBooleanSetting(EDITOR_DEFAULT_AUTHORSHIP_KEY, enabled);
}

export async function getDefaultBookmarkHighlight(): Promise<boolean> {
  return getBooleanSetting(EDITOR_DEFAULT_BOOKMARK_HIGHLIGHT_KEY, false);
}

export async function setDefaultBookmarkHighlight(enabled: boolean): Promise<void> {
  await setBooleanSetting(EDITOR_DEFAULT_BOOKMARK_HIGHLIGHT_KEY, enabled);
}

export async function getDefaultEditorFont(): Promise<EditorFontChoice> {
  return parseEditorFontChoice(await getStringSetting(EDITOR_DEFAULT_FONT_KEY));
}

export async function setDefaultEditorFont(choice: EditorFontChoice): Promise<void> {
  await setStringSetting(EDITOR_DEFAULT_FONT_KEY, choice);
}

export async function getDefaultFontSize(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [EDITOR_DEFAULT_FONT_SIZE_KEY],
  );

  return parseFontSize(rows[0]?.value) ?? EDITOR_FONT_SIZE_DEFAULT;
}

export async function setDefaultFontSize(size: number): Promise<void> {
  const clamped = Math.min(
    EDITOR_FONT_SIZE_MAX,
    Math.max(EDITOR_FONT_SIZE_MIN, size),
  );

  const db = await getDb();
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [EDITOR_DEFAULT_FONT_SIZE_KEY, String(clamped)],
  );
}

export async function getFontSize(fileId: string): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [`${FONT_SIZE_KEY_PREFIX}${fileId}`],
  );
  const perDocument = parseFontSize(rows[0]?.value);
  if (perDocument !== null) return perDocument;

  return getDefaultFontSize();
}

export async function setFontSize(fileId: string, size: number): Promise<void> {
  const clamped = Math.min(
    EDITOR_FONT_SIZE_MAX,
    Math.max(EDITOR_FONT_SIZE_MIN, size),
  );

  const db = await getDb();
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [`${FONT_SIZE_KEY_PREFIX}${fileId}`, String(clamped)],
  );
}

export async function getDocumentScrollPosition(fileId: string): Promise<number | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [`${DOCUMENT_SCROLL_KEY_PREFIX}${fileId}`],
  );
  const scrollY = Number.parseInt(rows[0]?.value ?? '', 10);
  return Number.isFinite(scrollY) && scrollY >= 0 ? scrollY : null;
}

export async function setDocumentScrollPosition(fileId: string, scrollY: number): Promise<void> {
  const db = await getDb();
  const nextScrollY = Math.max(0, Math.round(scrollY));
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [`${DOCUMENT_SCROLL_KEY_PREFIX}${fileId}`, String(nextScrollY)],
  );
}

export async function isSeedDocsComplete(): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [SEED_DOCS_FLAG_KEY],
  );

  return rows[0]?.value === '1';
}

export async function setSeedDocsComplete(): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
    [SEED_DOCS_FLAG_KEY, '1'],
  );
}