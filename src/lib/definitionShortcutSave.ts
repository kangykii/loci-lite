import type { DefinitionShortcutDetail } from '../editor/context/EditorChromeContext';
import { buildAtomRecord, saveAtomRecord } from './atomRecord';
import type { AtomRecord } from './atomTypes';

export async function persistDefinitionShortcut(
  fileId: string,
  detail: DefinitionShortcutDetail,
): Promise<AtomRecord> {
  const atom = buildAtomRecord({
    id: detail.atomId,
    fileId,
    type: 'definition',
    sourceText: detail.term,
    answer: detail.definition,
    spanStart: detail.spanStart,
    spanEnd: detail.spanEnd,
  });

  await saveAtomRecord(atom);
  return atom;
}
