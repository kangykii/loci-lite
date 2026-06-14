import { displayTitleForFile } from './documentMeta';
import { isTauri, readFile } from './tauri';
import { isLikelyWritingMarkdown } from './welcomeWritingSource';
import { listFilesByEditedAt } from '../store/files.store';

export type AiWelcomeSource = {
  fileId: string | null;
  markdown: string;
  title: string;
};

export async function latestWritingSource(): Promise<AiWelcomeSource> {
  if (!isTauri()) {
    return {
      fileId: null,
      markdown: 'No writing-like document was available. Write generic welcome prompts.',
      title: 'Writing desk',
    };
  }

  const files = await listFilesByEditedAt();

  for (const file of files) {
    let markdown = '';
    try {
      markdown = await readFile(file.path);
    } catch {
      continue;
    }

    if (isLikelyWritingMarkdown(markdown)) {
      return {
        fileId: file.id,
        markdown,
        title: displayTitleForFile(file.title, file.path),
      };
    }
  }

  return {
    fileId: null,
    markdown: 'No writing-like document was available. Write generic welcome prompts.',
    title: 'Writing desk',
  };
}
