import type { DeletePayloadKind } from './deletePayload';

export type BrowseDragLabel = {
  primary: string;
  secondary?: string;
};

const GHOST_ID = 'browse-drag-ghost';
const PRIMARY_MAX = 48;
const SECONDARY_MAX = 40;
let followerOffsetY = 0;

function readFollowerOffsetY(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    '--browse-drag-follower-offset-y',
  );
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
const BLANK_DRAG_IMAGE_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const ICON_PATHS: Record<DeletePayloadKind, string> = {
  document:
    'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  bookmark: 'M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
};

let blankDragImage: HTMLImageElement | null = null;
let dragMoveHandler: ((event: DragEvent) => void) | null = null;
let activeGhost: HTMLDivElement | null = null;

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 1)}…`;
}

function getBlankDragImage(): HTMLImageElement {
  if (!blankDragImage) {
    blankDragImage = new Image();
    blankDragImage.src = BLANK_DRAG_IMAGE_SRC;
  }

  return blankDragImage;
}

function createIcon(kind: DeletePayloadKind): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'browse-drag-ghost-icon');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICON_PATHS[kind]);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);

  return svg;
}

function ensureGhostElement(): HTMLDivElement {
  const existing = document.getElementById(GHOST_ID);
  if (existing instanceof HTMLDivElement) {
    return existing;
  }

  const ghost = document.createElement('div');
  ghost.id = GHOST_ID;
  ghost.className = 'browse-drag-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ghost);
  return ghost;
}

function positionFollower(clientX: number, clientY: number): void {
  if (!activeGhost) {
    return;
  }

  activeGhost.style.left = `${clientX}px`;
  activeGhost.style.top = `${clientY + followerOffsetY}px`;
}

export function updateBrowseDragGhost(
  kind: DeletePayloadKind,
  label: BrowseDragLabel,
): HTMLDivElement {
  const ghost = ensureGhostElement();
  ghost.replaceChildren();

  const textColumn = document.createElement('div');
  textColumn.className = 'browse-drag-ghost-text';

  const primary = document.createElement('span');
  primary.className = 'browse-drag-ghost-primary';
  primary.textContent = truncate(label.primary, PRIMARY_MAX);
  textColumn.appendChild(primary);

  if (label.secondary?.trim()) {
    const secondary = document.createElement('span');
    secondary.className = 'browse-drag-ghost-secondary';
    secondary.textContent = truncate(label.secondary, SECONDARY_MAX);
    textColumn.appendChild(secondary);
  }

  ghost.append(createIcon(kind), textColumn);
  return ghost;
}

export function suppressNativeDragImage(dataTransfer: DataTransfer): void {
  try {
    dataTransfer.setDragImage(getBlankDragImage(), 0, 0);
  } catch {
    // Payload and follower still work if setDragImage fails.
  }
}

export function showDragFollower(
  ghost: HTMLDivElement,
  clientX: number,
  clientY: number,
): void {
  followerOffsetY = readFollowerOffsetY();
  activeGhost = ghost;
  ghost.classList.add('is-follower');
  positionFollower(clientX, clientY);
}

export function installDragFollower(): void {
  removeDragFollower();

  dragMoveHandler = (event: DragEvent) => {
    positionFollower(event.clientX, event.clientY);
  };

  document.addEventListener('drag', dragMoveHandler);
}

export function removeDragFollower(): void {
  if (!dragMoveHandler) {
    return;
  }

  document.removeEventListener('drag', dragMoveHandler);
  dragMoveHandler = null;
}

export function hideBrowseDragGhost(): void {
  removeDragFollower();

  const ghost = document.getElementById(GHOST_ID);
  if (ghost) {
    ghost.classList.remove('is-follower');
    ghost.remove();
  }

  activeGhost = null;
}
