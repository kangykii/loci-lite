import { createContext, useContext, type ReactNode } from 'react';

export type AuthorshipAnnotationItem = {
  id: string;
  fileId: string;
  spanStart: number;
  spanEnd: number;
  source: 'paste' | 'ai';
  createdAt: number;
};

export type PasteRecordedDetail = {
  id: string;
  spanStart: number;
  spanEnd: number;
  pastedText: string;
};

export type MarkAsMineDetail = {
  annotationId: string;
  spanStart: number;
  spanEnd: number;
};

export type ReconciledAnnotationDetail = {
  id: string;
  spanStart: number;
  spanEnd: number;
  source: 'paste' | 'ai';
};

export type AuthorshipEditorContextValue = {
  fileId: string;
  annotations: AuthorshipAnnotationItem[];
  authorshipVisible: boolean;
  onPasteRecorded: (detail: PasteRecordedDetail) => void | Promise<void>;
  onMarkAsMine: (detail: MarkAsMineDetail) => void | Promise<void>;
  onAnnotationsReconciled: (
    annotations: ReconciledAnnotationDetail[],
  ) => void | Promise<void>;
};

export const emptyAuthorshipEditorContext: AuthorshipEditorContextValue = {
  fileId: '',
  annotations: [],
  authorshipVisible: false,
  onPasteRecorded: async () => undefined,
  onMarkAsMine: async () => undefined,
  onAnnotationsReconciled: async () => undefined,
};

const AuthorshipEditorContext = createContext<AuthorshipEditorContextValue>(
  emptyAuthorshipEditorContext,
);

type AuthorshipEditorProviderProps = {
  value: AuthorshipEditorContextValue;
  children: ReactNode;
};

export function AuthorshipEditorProvider({
  value,
  children,
}: AuthorshipEditorProviderProps) {
  return (
    <AuthorshipEditorContext.Provider value={value}>{children}</AuthorshipEditorContext.Provider>
  );
}

export function useAuthorshipEditorContext(): AuthorshipEditorContextValue {
  return useContext(AuthorshipEditorContext);
}
