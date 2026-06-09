import { ChevronLeft } from 'lucide-react';
import { createPortal } from 'react-dom';

type FocusExitButtonProps = {
  onExit: () => void;
  visible: boolean;
};

export default function FocusExitButton({ onExit, visible }: FocusExitButtonProps) {
  return createPortal(
    <button
      aria-label="Exit focus mode"
      className={`focus-exit-btn ${visible ? 'visible' : ''}`}
      onClick={onExit}
      type="button"
    >
      <ChevronLeft size={16} strokeWidth={1.5} />
    </button>,
    document.body,
  );
}
