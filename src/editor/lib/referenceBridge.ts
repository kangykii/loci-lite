export type ReferenceSelectionPoint = {
  key: string;
  offset: number;
  type: 'text' | 'element';
};

export type ReferenceSelection = {
  anchor: ReferenceSelectionPoint;
  focus: ReferenceSelectionPoint;
};

export type ReferenceInsertRequest = {
  citation: string;
  selection: ReferenceSelection;
};

type ReferenceInsertHandler = (request: ReferenceInsertRequest) => boolean;

let handler: ReferenceInsertHandler | null = null;

export function setReferenceInsertHandler(next: ReferenceInsertHandler | null): void {
  handler = next;
}

export function insertReference(request: ReferenceInsertRequest): boolean {
  return handler?.(request) ?? false;
}
