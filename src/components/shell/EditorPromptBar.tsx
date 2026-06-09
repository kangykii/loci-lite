import { useEffect, useRef } from 'react';
import type { BarMode } from '../../hooks/useBottomBar';

type EditorPromptBarProps = {
  findFocusTick: number;
  mode: BarMode;
  query: string;
  onClose: () => void;
  onFind: () => void;
  onQueryChange: (value: string) => void;
};

export default function EditorPromptBar({
  findFocusTick,
  mode,
  query,
  onClose,
  onFind,
  onQueryChange,
}: EditorPromptBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'find') {
      inputRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    if (findFocusTick === 0) return;

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [findFocusTick]);

  return (
    <label className="bb-prompt">
      <span className="visually-hidden">Find, replace, or prompt</span>
      <input
        ref={inputRef}
        aria-label="Find, replace, or prompt"
        className="bb-prompt-input"
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }

          if (event.key === 'Enter') {
            onFind();
          }
        }}
        placeholder="Find, replace, or prompt..."
        type="text"
        value={query}
      />
    </label>
  );
}
