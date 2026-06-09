import {
  hideBrowseDragGhost,
  installDragFollower,
  showDragFollower,
  suppressNativeDragImage,
  updateBrowseDragGhost,
  type BrowseDragLabel,
} from './browseDragGhost';
import { writeDragPayload, type DeletePayload } from './deletePayload';

export type { BrowseDragLabel };

const BROWSE_DRAGGING_CLASS = 'is-browse-dragging';

type BrowseDragStartEvent = {
  dataTransfer: DataTransfer | null;
  clientX: number;
  clientY: number;
};

let suppressNextClick = false;
let activeBrowseDragPayload: DeletePayload | null = null;

export function getActiveBrowseDragPayload(): DeletePayload | null {
  return activeBrowseDragPayload;
}

export function startBrowseDrag(
  event: BrowseDragStartEvent,
  payload: DeletePayload,
  label: BrowseDragLabel,
): void {
  const { dataTransfer, clientX, clientY } = event;
  if (!dataTransfer) {
    return;
  }

  suppressNextClick = false;
  activeBrowseDragPayload = payload;
  writeDragPayload(dataTransfer, payload);
  suppressNativeDragImage(dataTransfer);

  const ghost = updateBrowseDragGhost(payload.kind, label);
  showDragFollower(ghost, clientX, clientY);
  installDragFollower();

  document.documentElement.classList.add(BROWSE_DRAGGING_CLASS);
}

export function endBrowseDrag(): void {
  document.documentElement.classList.remove(BROWSE_DRAGGING_CLASS);
  hideBrowseDragGhost();
  activeBrowseDragPayload = null;
  suppressNextClick = true;
}

export function consumeBrowseDragClick(): boolean {
  if (!suppressNextClick) {
    return false;
  }

  suppressNextClick = false;
  return true;
}
