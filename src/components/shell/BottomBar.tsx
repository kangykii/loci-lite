import { ChevronDown, ChevronUp, ListTree } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { BarMode } from '../../hooks/useBottomBar';

import EditorBarMenu from './EditorBarMenu';
import EditorPromptBar from './EditorPromptBar';

type BottomBarProps = {
  arrowsDisabled: boolean;
  centreLabel: string;
  findFocusTick: number;
  isAuthorshipOn: boolean;
  isFocusMode: boolean;
  isBookmarkHighlightOn: boolean;
  isTypewriterOn: boolean;
  isOutlineOpen: boolean;
  mode: BarMode;
  query: string;
  replacement: string;
  onArrowDown: () => void;
  onArrowUp: () => void;
  onDeleteNote: () => void;
  onFind: () => void;
  onQueryChange: (value: string) => void;
  onReplace: () => void;
  onReplacementChange: (value: string) => void;
  onCloseFind: () => void;
  onAuthorshipToggle: () => void;
  onBookmarkHighlightToggle: () => void;
  onFocusModeToggle: () => void;
  onTypewriterToggle: () => void;
  onOutlineToggle: () => void;
};

export default function BottomBar({
  arrowsDisabled,
  centreLabel,
  findFocusTick,
  isAuthorshipOn,
  isFocusMode,
  isBookmarkHighlightOn,
  isTypewriterOn,
  isOutlineOpen,
  mode,
  query,
  replacement,
  onArrowDown,
  onArrowUp,
  onDeleteNote,
  onFind,
  onQueryChange,
  onReplace,
  onReplacementChange,
  onCloseFind,
  onAuthorshipToggle,
  onBookmarkHighlightToggle,
  onFocusModeToggle,
  onTypewriterToggle,
  onOutlineToggle,
}: BottomBarProps) {
  return createPortal(
    <footer aria-label="Editor controls" className="editor-bar bottom-bar" id="bottom-bar">
        <div className="bottom-bar-inner">
          <div className="bb-arrows">
            <button
              aria-label="Up"
              className="bb-arrow"
              disabled={arrowsDisabled}
              onClick={onArrowUp}
              type="button"
            >
              <ChevronUp size={13} strokeWidth={1.8} />
            </button>
            <button
              aria-label="Down"
              className="bb-arrow"
              disabled={arrowsDisabled}
              onClick={onArrowDown}
              type="button"
            >
              <ChevronDown size={13} strokeWidth={1.8} />
            </button>
          </div>
          <span className="bb-label">{centreLabel}</span>
          <EditorPromptBar
            findFocusTick={findFocusTick}
            mode={mode}
            onClose={onCloseFind}
            onFind={onFind}
            onQueryChange={onQueryChange}
            query={query}
          />
          <button
            aria-expanded={isOutlineOpen}
            aria-label={isOutlineOpen ? 'Close outline' : 'Open outline'}
            aria-pressed={isOutlineOpen}
            className={`bb-action ${isOutlineOpen ? 'active' : ''}`}
            onClick={onOutlineToggle}
            type="button"
          >
            <ListTree size={14} strokeWidth={1.5} />
            <span>Outline</span>
          </button>
          <EditorBarMenu
            isAuthorshipOn={isAuthorshipOn}
            isBookmarkHighlightOn={isBookmarkHighlightOn}
            isFocusMode={isFocusMode}
            isTypewriterOn={isTypewriterOn}
            onAuthorshipToggle={onAuthorshipToggle}
            onBookmarkHighlightToggle={onBookmarkHighlightToggle}
            onDeleteNote={onDeleteNote}
            onFocusModeToggle={onFocusModeToggle}
            onTypewriterToggle={onTypewriterToggle}
          />
        </div>
    </footer>,
    document.body,
  );
}
