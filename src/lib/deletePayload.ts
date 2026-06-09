export const DELETE_PAYLOAD_MIME = 'application/x-loci-delete';

export type DeletePayloadKind = 'document' | 'bookmark';

export type DeletePayload = {
  kind: DeletePayloadKind;
  id: string;
};

export function encodeDeletePayload(payload: DeletePayload): string {
  return JSON.stringify(payload);
}

export function decodeDeletePayload(raw: string): DeletePayload | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DeletePayload;

    if (
      (parsed.kind === 'document' || parsed.kind === 'bookmark') &&
      typeof parsed.id === 'string'
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

export function writeDragPayload(
  dataTransfer: DataTransfer,
  payload: DeletePayload,
): void {
  const encoded = encodeDeletePayload(payload);
  dataTransfer.setData(DELETE_PAYLOAD_MIME, encoded);
  dataTransfer.setData('text/plain', encoded);
  dataTransfer.effectAllowed = 'move';
}

export function isBrowseDragTransfer(dataTransfer: DataTransfer): boolean {
  return [...dataTransfer.types].some(
    (type) => type === DELETE_PAYLOAD_MIME || type === 'text/plain',
  );
}

export function readDragPayload(dataTransfer: DataTransfer): DeletePayload | null {
  return (
    decodeDeletePayload(dataTransfer.getData(DELETE_PAYLOAD_MIME)) ??
    decodeDeletePayload(dataTransfer.getData('text/plain'))
  );
}
