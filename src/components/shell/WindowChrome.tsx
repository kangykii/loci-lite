import { Copy, Minus, Square, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { useWindowChrome } from '../../hooks/useWindowChrome';
import { isTauri } from '../../lib/tauri';

export default function WindowChrome() {
  const {
    handleClose,
    handleDragMouseDown,
    handleMinimize,
    handleRevealEnter,
    handleRevealLeave,
    handleToggleMaximize,
    isMaximized,
    isRevealed,
  } = useWindowChrome();

  if (!isTauri()) {
    return null;
  }

  return createPortal(
    <div
      className={`window-chrome-zone${isRevealed ? ' is-revealed' : ''}`}
      onMouseEnter={handleRevealEnter}
      onMouseLeave={handleRevealLeave}
    >
      <div className="window-chrome">
        <div
          aria-hidden
          className="window-chrome-drag"
          onMouseDown={handleDragMouseDown}
        />
        <div aria-label="Window controls" className="window-chrome-controls" role="group">
          <button
            aria-label="Minimize"
            className="window-control window-control-minimize"
            onClick={handleMinimize}
            type="button"
          >
            <Minus size={12} strokeWidth={2} />
          </button>
          <button
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
            className="window-control window-control-maximize"
            onClick={handleToggleMaximize}
            type="button"
          >
            {isMaximized ? <Copy size={11} strokeWidth={2} /> : <Square size={11} strokeWidth={2} />}
          </button>
          <button
            aria-label="Close"
            className="window-control window-control-close"
            onClick={handleClose}
            type="button"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
