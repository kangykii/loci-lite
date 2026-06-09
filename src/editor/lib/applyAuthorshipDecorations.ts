import type { NodeKey } from 'lexical';
import {
  getAuthorshipRuns,
  hasAuthorshipAnnotation,
  removeAuthorshipDecoration,
  removeAuthorshipNode,
  type AuthorshipRun,
} from './authorshipNodeOps';
import type { TextSegment } from './resolvePasteSpan';
import type { AuthorshipSource } from '../nodes/AuthorshipNode';

export type AuthorshipDecorationTarget = {
  id: string;
  source: AuthorshipSource;
  spanStart: number;
  spanEnd: number;
};

export function $hasAuthorshipAnnotation(annotationId: string): boolean {
  return hasAuthorshipAnnotation(annotationId);
}

export function $getAuthorshipRuns(annotationId: string): AuthorshipRun[] {
  return getAuthorshipRuns(annotationId);
}

export function $wrapAuthorshipSegments(
  _segments: TextSegment[],
  _annotationId: string,
  _source: AuthorshipSource,
): boolean {
  return false;
}

export function $wrapAuthorshipTextContent(
  _searchText: string,
  _annotationId: string,
  _source: AuthorshipSource,
): boolean {
  return false;
}

export function $removeAuthorshipNode(nodeKey: NodeKey): void {
  removeAuthorshipNode(nodeKey);
}

export function $removeAuthorshipDecoration(annotationId: string): void {
  removeAuthorshipDecoration(annotationId);
}

export function $applyAuthorshipDecorations(
  _markdown: string,
  _targets: AuthorshipDecorationTarget[],
): void {
  // Authorship now renders from SQLite ranges in AuthorshipOverlayPlugin.
  // Keep this no-op facade temporarily for legacy call sites while migration settles.
}
