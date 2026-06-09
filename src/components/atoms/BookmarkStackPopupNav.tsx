import { Shuffle } from 'lucide-react';

type BookmarkStackPopupNavProps = {
  index: number;
  total: number;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onShuffle: () => void;
};

export default function BookmarkStackPopupNav({
  index,
  total,
  disabled = false,
  onPrev,
  onNext,
  onShuffle,
}: BookmarkStackPopupNavProps) {
  return (
    <div className="bookmark-stack-popup-nav">
      <button
        className="bookmark-stack-popup-nav-btn"
        disabled={disabled}
        onClick={onPrev}
        type="button"
      >
        Previous
      </button>
      <span className="bookmark-stack-popup-counter">
        {index + 1} / {total}
      </span>
      {total > 1 ? (
        <button
          aria-label="Shuffle cards"
          className="bookmark-stack-popup-nav-btn bookmark-stack-popup-nav-icon-btn"
          disabled={disabled}
          onClick={onShuffle}
          type="button"
        >
          <Shuffle size={16} strokeWidth={1.5} />
        </button>
      ) : null}
      <button
        className="bookmark-stack-popup-nav-btn"
        disabled={disabled}
        onClick={onNext}
        type="button"
      >
        Next
      </button>
    </div>
  );
}
