import { createContext, useContext, type ReactNode } from 'react';

export type BookmarkRequestDetail = {
  selectedText: string;
  spanStart: number | null;
  spanEnd: number | null;
};

export type SelectionDetail = {
  hasSelection: boolean;
  selectedText: string;
};

export type DefinitionShortcutDetail = {
  atomId: string;
  term: string;
  definition: string;
  nodeKey: string;
  spanStart: number | null;
  spanEnd: number | null;
};

export type EditorChromeContextValue = {
  isFocusMode: boolean;
  onBookmarkRequest: (detail: BookmarkRequestDetail) => void;
  onDefinitionShortcut: (detail: DefinitionShortcutDetail) => void | Promise<void>;
  onOpenDocument: (fileId: string) => void;
  onSelectionChange: (detail: SelectionDetail) => void;
};

export const emptyEditorChromeContext: EditorChromeContextValue = {
  isFocusMode: false,
  onBookmarkRequest: () => undefined,
  onDefinitionShortcut: () => undefined,
  onOpenDocument: () => undefined,
  onSelectionChange: () => undefined,
};

const EditorChromeContext = createContext<EditorChromeContextValue>(emptyEditorChromeContext);

type EditorChromeProviderProps = {
  value: EditorChromeContextValue;
  children: ReactNode;
};

export function EditorChromeProvider({ value, children }: EditorChromeProviderProps) {
  return <EditorChromeContext.Provider value={value}>{children}</EditorChromeContext.Provider>;
}

export function useEditorChromeContext(): EditorChromeContextValue {
  return useContext(EditorChromeContext);
}
