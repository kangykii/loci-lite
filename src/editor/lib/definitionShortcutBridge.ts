import type { DefinitionShortcutDetail } from '../context/EditorChromeContext';

type DefinitionShortcutHandler = (
  detail: DefinitionShortcutDetail,
) => void | Promise<void>;

let handler: DefinitionShortcutHandler | null = null;

export function setDefinitionShortcutHandler(
  next: DefinitionShortcutHandler | null,
): void {
  handler = next;
}

export function invokeDefinitionShortcut(detail: DefinitionShortcutDetail): void {
  void handler?.(detail);
}
