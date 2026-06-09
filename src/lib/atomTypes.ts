export type AtomType = 'definition' | 'note' | 'reminder';

export type AtomRecord = {
  id: string;
  fileId: string;
  type: AtomType;
  question: string;
  answer: string;
  sourceText: string;
  groupLabel: string | null;
  spanStart: number | null;
  spanEnd: number | null;
  createdAt: number;
};

export type CreateAtomInput = {
  fileId: string;
  type: AtomType;
  sourceText: string;
  answer: string;
  spanStart: number | null;
  spanEnd: number | null;
  id?: string;
};
