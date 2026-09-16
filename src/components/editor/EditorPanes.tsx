import { useCallback, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import EditorView from '../../views/EditorView';

type Props = {
  fileIds: [string, string | null];
  activePaneId: string | null;
  canSplit: boolean;
  onActivatePane: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onDocumentDeleted: (fileId: string) => void;
  onOpenDocument: (fileId: string) => void;
  onOpenInPane: (sourceId: string, fileId: string, placement: 'replace' | 'split') => void;
};

function Pane({ id, otherId, active, canSplit, splitMode, onActivatePane, onCloseTab, onDocumentDeleted, onOpenDocument, onOpenInPane }: {
  id: string;
  otherId: string | null;
  active: boolean;
  canSplit: boolean;
  splitMode: boolean;
  onActivatePane: (id: string) => void;
  onCloseTab: (id: string) => void;
  onDocumentDeleted: (id: string) => void;
  onOpenDocument: (id: string) => void;
  onOpenInPane: (sourceId: string, id: string, placement: 'replace' | 'split') => void;
}) {
  return (
    <div className="editor-pane-slot" data-editor-slot={id}>
      <div className="editor-pane" data-editor-pane={id} onPointerDown={() => onActivatePane(id)}>
        <EditorView
          active={active}
          canSplit={canSplit && !splitMode}
          fileId={id}
          otherFileId={otherId}
          splitMode={splitMode}
          onActivate={() => onActivatePane(id)}
          onCloseTab={() => onCloseTab(id)}
          onDocumentDeleted={onDocumentDeleted}
          onOpenDocument={onOpenDocument}
          onOpenInPane={(nextId, placement) => onOpenInPane(id, nextId, placement)}
        />
      </div>
    </div>
  );
}

export default function EditorPanes({ fileIds, activePaneId, canSplit, onActivatePane, onCloseTab, onDocumentDeleted, onOpenDocument, onOpenInPane }: Props) {
  const [ratio, setRatio] = useState(0.5);
  const rootRef = useRef<HTMLDivElement>(null);
  const splitMode = Boolean(fileIds[1]);

  const clampRatio = useCallback((next: number) => {
    const width = rootRef.current?.clientWidth ?? 0;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const min = width ? Math.min(0.48, (rem * 22) / width) : 0.25;
    setRatio(Math.max(min, Math.min(1 - min, next)));
  }, []);

  const moveDivider = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) clampRatio((event.clientX - rect.left) / rect.width);
  };

  const handleDividerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    clampRatio(ratio + (event.key === 'ArrowLeft' ? -0.025 : 0.025));
  };

  const style = {
    '--split-left-fr': `${ratio}fr`,
    '--split-right-fr': `${1 - ratio}fr`,
  } as CSSProperties;

  return (
    <div className={`editor-panes${splitMode ? ' is-split' : ''}`} ref={rootRef} style={style}>
      <Pane active={activePaneId === fileIds[0]} canSplit={canSplit} id={fileIds[0]} otherId={fileIds[1]} splitMode={splitMode} onActivatePane={onActivatePane} onCloseTab={onCloseTab} onDocumentDeleted={onDocumentDeleted} onOpenDocument={onOpenDocument} onOpenInPane={onOpenInPane} />
      {splitMode ? (
        <button
          aria-label="Resize document split"
          aria-orientation="vertical"
          aria-valuemax={75}
          aria-valuemin={25}
          aria-valuenow={Math.round(ratio * 100)}
          className="editor-split-divider"
          onKeyDown={handleDividerKey}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            moveDivider(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) moveDivider(event);
          }}
          onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
          role="separator"
          type="button"
        />
      ) : null}
      {fileIds[1] ? <Pane active={activePaneId === fileIds[1]} canSplit={canSplit} id={fileIds[1]} otherId={fileIds[0]} splitMode={splitMode} onActivatePane={onActivatePane} onCloseTab={onCloseTab} onDocumentDeleted={onDocumentDeleted} onOpenDocument={onOpenDocument} onOpenInPane={onOpenInPane} /> : null}
    </div>
  );
}
