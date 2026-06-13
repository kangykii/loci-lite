import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { AtomType } from '../../lib/atomTypes';
import {
  getReminderDueAt,
  REMINDER_PRESETS,
  type ReminderPresetId,
} from '../../lib/reminderPresets';
import SegmentedControl from '../ui/SegmentedControl';

export type AtomSavePayload = {
  type: AtomType;
  sourceText: string;
  content: string;
  reminderDueAt: number | null;
};

export type AtomPopupMode = 'create' | 'edit';

type AtomPopupProps = {
  mode?: AtomPopupMode;
  selectedText: string;
  initialType?: AtomType;
  initialContent?: string;
  headerLabel?: string;
  saveLabel?: string;
  typeOptions?: AtomType[];
  isSaving?: boolean;
  onSave: (payload: AtomSavePayload) => void;
  onClose: () => void;
};

const TYPE_OPTIONS: { type: AtomType; label: string }[] = [
  { type: 'definition', label: 'Definition' },
  { type: 'note', label: 'Note' },
  { type: 'reminder', label: 'Reminder' },
];

const PLACEHOLDERS: Record<AtomType, string> = {
  definition: 'Define this term...',
  note: 'Add a note...',
  reminder: 'What should this remind you of?',
};

export default function AtomPopup({
  mode = 'create',
  selectedText,
  initialType = 'note',
  initialContent = '',
  headerLabel,
  saveLabel,
  typeOptions,
  isSaving = false,
  onSave,
  onClose,
}: AtomPopupProps) {
  const [type, setType] = useState<AtomType>(initialType);
  const [content, setContent] = useState(initialContent);
  const [sourceDraft, setSourceDraft] = useState(selectedText);
  const [reminderPreset, setReminderPreset] = useState<ReminderPresetId>('tomorrow');
  const [isEditingSource, setIsEditingSource] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const resolvedHeader = headerLabel ?? 'Bookmark';
  const resolvedSaveLabel = saveLabel ?? (mode === 'edit' ? 'Save changes' : 'Save');
  const availableTypeOptions = TYPE_OPTIONS.filter((option) =>
    typeOptions ? typeOptions.includes(option.type) : true,
  );

  useEffect(() => {
    if (mode === 'edit') {
      setType(initialType);
      setContent(initialContent);
    } else {
      setType('note');
      setContent('');
    }

    setReminderPreset('tomorrow');
    setSourceDraft(selectedText);
    setIsEditingSource(false);
  }, [initialContent, initialType, mode, selectedText]);

  useEffect(() => {
    if (availableTypeOptions.some((option) => option.type === type)) {
      return;
    }

    setType(availableTypeOptions[0]?.type ?? 'note');
  }, [availableTypeOptions, type]);

  useEffect(() => {
    if (isEditingSource) {
      sourceInputRef.current?.focus();
      sourceInputRef.current?.select();
    }
  }, [isEditingSource]);

  const resizeContentField = useCallback(() => {
    const field = contentRef.current;
    if (!field) {
      return;
    }

    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resizeContentField();
  }, [content, resizeContentField]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isEditingSource) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditingSource, onClose]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onClose]);

  const finishSourceEdit = useCallback(
    (commit: boolean) => {
      if (commit) {
        setSourceDraft((current) => current.trim());
      } else {
        setSourceDraft(selectedText);
      }

      setIsEditingSource(false);
    },
    [selectedText],
  );

  const trimmedContent = content.trim();
  const trimmedSource = sourceDraft.trim();
  const canSave = trimmedContent.length > 0 && trimmedSource.length > 0 && !isSaving;

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    onSave({
      type,
      sourceText: trimmedSource,
      content: trimmedContent,
      reminderDueAt: type === 'reminder' ? getReminderDueAt(reminderPreset) : null,
    });
  };

  return (
    <div className="atom-popup-layer" role="presentation">
      <div
        ref={panelRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="atom-popup"
        role="dialog"
      >
        <p className="atom-popup-label" id={titleId}>
          {resolvedHeader}
        </p>

        <div
          className={`atom-popup-source-shell${isEditingSource ? ' is-editing' : ''}`}
          onDoubleClick={() => {
            if (!isEditingSource) {
              setIsEditingSource(true);
            }
          }}
          title={isEditingSource ? undefined : 'Double-click to edit'}
        >
          <input
            ref={sourceInputRef}
            aria-label="Bookmark source text"
            className="atom-popup-source-field"
            onBlur={() => finishSourceEdit(true)}
            onChange={(event) => setSourceDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                finishSourceEdit(true);
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                finishSourceEdit(false);
              }
            }}
            readOnly={!isEditingSource}
            type="text"
            value={sourceDraft}
          />
        </div>

        {availableTypeOptions.length > 1 ? (
          <SegmentedControl
            aria-label="Atom type"
            fullWidth
            onChange={setType}
            options={availableTypeOptions.map((option) => ({
              label: option.label,
              value: option.type,
            }))}
            value={type}
          />
        ) : null}

        {type === 'reminder' ? (
          <label className="atom-popup-reminder">
            <span className="atom-popup-reminder-label">Resurface</span>
            <select
              className="atom-popup-reminder-select"
              onChange={(event) =>
                setReminderPreset(event.target.value as ReminderPresetId)
              }
              value={reminderPreset}
            >
              {REMINDER_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="atom-popup-content-wrap">
          <span className="visually-hidden">Atom content</span>
          <textarea
            ref={contentRef}
            className="atom-popup-content"
            onChange={(event) => setContent(event.target.value)}
            placeholder={PLACEHOLDERS[type]}
            rows={1}
            value={content}
          />
        </label>

        <div className="atom-popup-actions">
          <button
            className="atom-popup-save"
            disabled={!canSave}
            onClick={handleSave}
            type="button"
          >
            {resolvedSaveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
