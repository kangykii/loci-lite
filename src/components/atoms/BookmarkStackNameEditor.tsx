import { useEffect, useRef, useState } from 'react';

type BookmarkStackNameEditorProps = {
  displayName: string;
  variant: 'grid' | 'popup';
  onRename: (name: string) => void;
  onRenameStart?: () => void;
  onRenameEnd?: () => void;
};

export default function BookmarkStackNameEditor({
  displayName,
  variant,
  onRename,
  onRenameStart,
  onRenameEnd,
}: BookmarkStackNameEditorProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenaming) {
      setDraftName(displayName);
    }
  }, [displayName, isRenaming]);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const finishRename = (commit: boolean) => {
    if (commit) {
      onRename(draftName);
    } else {
      setDraftName(displayName);
    }

    setIsRenaming(false);
    onRenameEnd?.();
  };

  const startRename = () => {
    onRenameStart?.();
    setIsRenaming(true);
  };

  const stopPropagation = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  if (isRenaming) {
    return (
      <div
        className={`bookmark-stack-name-editor ${variant === 'popup' ? 'is-popup' : ''}`}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
      >
        <input
          ref={inputRef}
          aria-label="Stack name"
          className={`bookmark-stack-name-input is-${variant}`}
          onBlur={() => finishRename(true)}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();

            if (event.key === 'Enter') {
              event.preventDefault();
              finishRename(true);
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              finishRename(false);
            }
          }}
          type="text"
          value={draftName}
        />
      </div>
    );
  }

  return (
    <div
      className={`bookmark-stack-name-editor ${variant === 'popup' ? 'is-popup' : ''}`}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startRename();
      }}
    >
      <p className={`bookmark-stack-name-text is-${variant} is-renamable`}>{displayName}</p>
    </div>
  );
}
