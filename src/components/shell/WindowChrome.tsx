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
        <div aria-label="Window controls" className="window-chrome-controls" role="group">
          <button
            aria-label="Close"
            className="window-control window-control-close"
            onClick={handleClose}
            type="button"
          >
          </button>
          <button
            aria-label="Minimize"
            className="window-control window-control-minimize"
            onClick={handleMinimize}
            type="button"
          >
          </button>
          <button
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
            className="window-control window-control-maximize"
            onClick={handleToggleMaximize}
            type="button"
          >
          </button>
        </div>
        <div
          aria-hidden
          className="window-chrome-drag"
          onMouseDown={handleDragMouseDown}
        />
      </div>
    </div>,
    document.body,
  );
}
