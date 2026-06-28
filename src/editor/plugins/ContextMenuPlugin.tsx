import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Bookmark, Check, Copy, Scissors, Search, Sparkles, Clipboard } from 'lucide-react';
import { $getSelection, $isRangeSelection } from 'lexical';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import SearchInNotesModal from '../../components/editor/SearchInNotesModal';
import ContextMenu, { type ContextMenuEntry } from '../../components/ui/ContextMenu';
import { findSpanInMarkdown } from '../../lib/atomSpans';
import { lookupWord } from '../../lib/tauri';
import { useSearchableDocuments } from '../../hooks/useSearchableDocuments';
import { markdownTransformers } from '../config/markdownTransformers';
import { useAuthorshipEditorContext } from '../context/AuthorshipEditorContext';
import { useEditorChromeContext } from '../context/EditorChromeContext';
import { buildAuthorshipDocIndex } from '../lib/authorshipIndex';
import {
  findIntersectingAnnotation,
  intersectionRange,
} from '../lib/contextMenuAnnotations';
import {
  clickedVisibleTextOffset,
  selectedVisibleTextRange,
  textForRange,
  wordRangeAtOffset,
  type VisibleTextRange,
} from '../lib/contextMenuRanges';

type MenuState = {
  x: number;
  y: number;
  selectedText: string;
  lookupText: string;
  annotationId: string | null;
  markRange: VisibleTextRange | null;
};

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

export default function ContextMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const { onBookmarkRequest, onOpenDocument } = useEditorChromeContext();
  const { annotations, onMarkAsMine } = useAuthorshipEditorContext();
  const { documents, refresh } = useSearchableDocuments();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const handleContextMenu = (event: MouseEvent) => {
      let selectedText = '';
      let visibleText = '';
      editor.getEditorState().read(() => {
        visibleText = buildAuthorshipDocIndex().docText;
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          selectedText = selection.getTextContent().trim();
        }
      });

      const selectionRange = selectedVisibleTextRange(root);
      const clickedOffset = selectionRange ? null : clickedVisibleTextOffset(root, event);
      const candidateRange =
        selectionRange ??
        (clickedOffset === null ? null : wordRangeAtOffset(visibleText, clickedOffset));
      const annotation = findIntersectingAnnotation(annotations, candidateRange);

      event.preventDefault();
      setMenu({
        x: event.clientX,
        y: event.clientY,
        selectedText,
        lookupText: selectedText || textForRange(visibleText, candidateRange),
        annotationId: annotation?.id ?? null,
        markRange: intersectionRange(annotation, candidateRange),
      });
    };

    root.addEventListener('contextmenu', handleContextMenu);
    return () => root.removeEventListener('contextmenu', handleContextMenu);
  }, [annotations, editor]);

  const handleBookmark = useCallback(() => {
    if (!menu?.selectedText) return;
    editor.getEditorState().read(() => {
      const markdown = $convertToMarkdownString(markdownTransformers);
      const spans = findSpanInMarkdown(markdown, menu.selectedText);
      onBookmarkRequest({
        selectedText: menu.selectedText,
        spanStart: spans?.spanStart ?? null,
        spanEnd: spans?.spanEnd ?? null,
      });
    });
  }, [editor, menu, onBookmarkRequest]);

  const handleMarkAsMine = useCallback(() => {
    if (!menu?.annotationId || !menu.markRange) return;
    void Promise.resolve(
      onMarkAsMine({
        annotationId: menu.annotationId,
        spanStart: menu.markRange.spanStart,
        spanEnd: menu.markRange.spanEnd,
      }),
    ).catch(() => undefined);
  }, [menu, onMarkAsMine]);

  const menuItems = useMemo<ContextMenuEntry[]>(() => {
    if (!menu) return [];
    const textLabel = menu.lookupText ? `"${menu.lookupText.slice(0, 28)}"` : 'selection';
    return [
      { label: 'Cut', icon: <Scissors size={16} strokeWidth={1.5} />, onClick: () => document.execCommand('cut') },
      { label: 'Copy', icon: <Copy size={16} strokeWidth={1.5} />, onClick: () => document.execCommand('copy') },
      { label: 'Paste', icon: <Clipboard size={16} strokeWidth={1.5} />, onClick: () => document.execCommand('paste') },
      { kind: 'separator' },
      { label: 'Bookmark', icon: <Bookmark size={16} strokeWidth={1.5} />, hidden: !menu.selectedText, onClick: handleBookmark },
      { label: 'Mark as mine', icon: <Check size={16} strokeWidth={1.5} />, hidden: !menu.annotationId, onClick: handleMarkAsMine },
      { kind: 'separator' },
      { label: `Look up ${textLabel}`, icon: <Sparkles size={16} strokeWidth={1.5} />, hidden: !isMac || !menu.lookupText, onClick: () => void lookupWord(menu.lookupText) },
      { label: 'Search in notes', icon: <Search size={16} strokeWidth={1.5} />, disabled: !menu.lookupText, onClick: () => { void refresh(); setSearchQuery(menu.lookupText); } },
    ];
  }, [handleBookmark, handleMarkAsMine, menu, refresh]);

  return (
    <>
      {menu
        ? createPortal(
            <ContextMenu
              items={menuItems}
              onClose={() => setMenu(null)}
              x={menu.x}
              y={menu.y}
            />,
            document.body,
          )
        : null}
      {searchQuery
        ? createPortal(
            <SearchInNotesModal
              documents={documents}
              onClose={() => setSearchQuery(null)}
              onOpenDocument={onOpenDocument}
              query={searchQuery}
            />,
            document.body,
          )
        : null}
    </>
  );
}
