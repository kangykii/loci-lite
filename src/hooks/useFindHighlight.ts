import { type RefObject, useEffect, useRef } from 'react';
import { scrollRangeIntoEditorView } from '../lib/scrollEditorTarget';
import type { BarMode } from './useBottomBar';

const MATCH_HIGHLIGHT = 'loci-find-match';
const ACTIVE_HIGHLIGHT = 'loci-find-active';

type HighlightRegistry = {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => void;
};

type HighlightWindow = Window & {
  Highlight?: new (...ranges: Range[]) => unknown;
};

function getHighlightRegistry(): HighlightRegistry | null {
  const css = window.CSS as { highlights?: HighlightRegistry };
  return css.highlights ?? null;
}

function supportsCustomHighlight(): boolean {
  return Boolean(getHighlightRegistry() && (window as HighlightWindow).Highlight);
}

function clearFindHighlights(): void {
  const registry = getHighlightRegistry();
  registry?.delete(MATCH_HIGHLIGHT);
  registry?.delete(ACTIVE_HIGHLIGHT);
}

function findMatchRanges(root: HTMLElement, query: string): Range[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const ranges: Range[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const lower = (textNode.textContent ?? '').toLowerCase();
    let index = lower.indexOf(needle);

    while (index !== -1) {
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + needle.length);
      ranges.push(range);
      index = lower.indexOf(needle, index + needle.length);
    }

    node = walker.nextNode();
  }

  return ranges;
}

function applyHighlights(ranges: Range[], activeIndex: number): Range | null {
  const registry = getHighlightRegistry();
  const HighlightConstructor = (window as HighlightWindow).Highlight;
  if (!registry || !HighlightConstructor) return null;

  clearFindHighlights();
  if (ranges.length === 0) return null;

  const index = Math.min(Math.max(activeIndex, 0), ranges.length - 1);
  registry.set(MATCH_HIGHLIGHT, new HighlightConstructor(...ranges));
  const active = ranges[index];
  if (active) registry.set(ACTIVE_HIGHLIGHT, new HighlightConstructor(active));
  return active ?? null;
}

export function useFindHighlight(
  editorRootRef: RefObject<HTMLDivElement | null>,
  mode: BarMode,
  query: string,
  matchIndex: number,
): void {
  const scrollKeyRef = useRef('');

  useEffect(() => {
    const root = editorRootRef.current;
    if (!root || mode !== 'find' || query.trim() === '' || !supportsCustomHighlight()) {
      clearFindHighlights();
      scrollKeyRef.current = '';
      return;
    }

    const scrollKey = `${query}:${matchIndex}`;
    const shouldScroll = scrollKeyRef.current !== scrollKey;
    scrollKeyRef.current = scrollKey;

    const repaint = (scroll: boolean) => {
      const active = applyHighlights(findMatchRanges(root, query), matchIndex);
      if (scroll && active) scrollRangeIntoEditorView(active);
    };

    repaint(shouldScroll);

    const repaintOnly = () => repaint(false);
    const observer = new MutationObserver(repaintOnly);
    observer.observe(root, { characterData: true, childList: true, subtree: true });
    window.addEventListener('resize', repaintOnly);
    window.addEventListener('scroll', repaintOnly, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', repaintOnly);
      window.removeEventListener('scroll', repaintOnly, true);
      clearFindHighlights();
      scrollKeyRef.current = '';
    };
  }, [editorRootRef, matchIndex, mode, query]);
}
