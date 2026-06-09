import type { AtomDecorationItem } from '../editor/context/AtomEditorContext';
import type { AtomRecord } from './atomTypes';

export function atomRecordToDecoration(record: AtomRecord): AtomDecorationItem {
  return {
    id: record.id,
    fileId: record.fileId,
    type: record.type,
    content: record.answer,
    sourceText: record.sourceText,
    spanStart: record.spanStart,
    spanEnd: record.spanEnd,
  };
}
