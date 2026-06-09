import { createContext, useContext, type ReactNode } from 'react';
import type { AtomType } from '../../lib/atomTypes';

export type AtomDecorationItem = {
  id: string;
  fileId: string;
  type: AtomType;
  content: string;
  sourceText: string;
  spanStart: number | null;
  spanEnd: number | null;
};

export type AtomEditorContextValue = {
  fileId: string;
  atoms: AtomDecorationItem[];
  definitionAtoms: AtomDecorationItem[];
  createdAtom: AtomDecorationItem | null;
  refreshSignal: number;
  clearCreatedAtom: () => void;
  requestDeleteAtom: (id: string) => void | Promise<void>;
};

export const emptyAtomEditorContext: AtomEditorContextValue = {
  fileId: '',
  atoms: [],
  definitionAtoms: [],
  createdAtom: null,
  refreshSignal: 0,
  clearCreatedAtom: () => undefined,
  requestDeleteAtom: async () => undefined,
};

const AtomEditorContext = createContext<AtomEditorContextValue>(emptyAtomEditorContext);

type AtomEditorProviderProps = {
  value: AtomEditorContextValue;
  children: ReactNode;
};

export function AtomEditorProvider({ value, children }: AtomEditorProviderProps) {
  return <AtomEditorContext.Provider value={value}>{children}</AtomEditorContext.Provider>;
}

export function useAtomEditorContext(): AtomEditorContextValue {
  return useContext(AtomEditorContext);
}
