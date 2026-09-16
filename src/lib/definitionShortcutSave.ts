import type { DefinitionShortcutDetail } from '../editor/context/EditorChromeContext';
import { saveAtomRecord } from './atomRecord';
import type { AtomRecord } from './atomTypes';

export async function persistDefinitionShortcut(
  fileId: string,
  detail: DefinitionShortcutDetail,
): Promise<AtomRecord> {
  return saveAtomRecord({
    id: detail.atomId,
    fileId,
    type: 'definition',
    sourceText: detail.term,
    answer: detail.definition,
    spanStart: detail.spanStart,
    spanEnd: detail.spanEnd,
  });
}
