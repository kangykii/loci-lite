import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type Ref } from 'react';

const DEFAULT_DEBOUNCE_MS = 280;

type SearchFieldProps = {
  'aria-label': string;
  className?: string;
  debounceMs?: number;
  inputRef?: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
  placeholder: string;
  showLeadingIcon?: boolean;
  value: string;
  variant?: 'panel' | 'pill';
};

export default function SearchField({
  'aria-label': ariaLabel,
  className = '',
  debounceMs = DEFAULT_DEBOUNCE_MS,
  inputRef,
  onChange,
  placeholder,
  showLeadingIcon = true,
  value,
  variant = 'panel',
}: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const skipSyncRef = useRef(false);
  const shellClass = `search-field search-field--${variant}${className ? ` ${className}` : ''}`;

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs <= 0) {
      return;
    }

    const id = window.setTimeout(() => {
      skipSyncRef.current = true;
      onChange(draft);
    }, debounceMs);

    return () => window.clearTimeout(id);
  }, [debounceMs, draft, onChange]);

  const handleChange = (next: string) => {
    setDraft(next);

    if (debounceMs <= 0) {
      skipSyncRef.current = true;
      onChange(next);
    }
  };

  return (
    <label className={shellClass}>
      {showLeadingIcon ? <Search size={15} strokeWidth={1.5} /> : null}
      <input
        aria-label={ariaLabel}
        inputMode="search"
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        ref={inputRef}
        type="text"
        value={draft}
      />
      {draft.length > 0 ? (
        <button
          aria-label="Clear search"
          className="search-field-clear"
          onClick={() => handleChange('')}
          type="button"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      ) : null}
    </label>
  );
}
