import { ChevronDown, ChevronUp } from 'lucide-react';

type SettingsFontSizeControlProps = {
  atMax: boolean;
  atMin: boolean;
  disabled?: boolean;
  fontSize: number;
  onStepDown: () => void;
  onStepUp: () => void;
};

export default function SettingsFontSizeControl({
  atMax,
  atMin,
  disabled = false,
  fontSize,
  onStepDown,
  onStepUp,
}: SettingsFontSizeControlProps) {
  return (
    <div aria-label="Default editor font size" className="settings-font-size" role="group">
      <button
        aria-label="Decrease default font size"
        className="settings-font-size-button"
        disabled={disabled || atMin}
        onClick={onStepDown}
        type="button"
      >
        <ChevronDown size={14} strokeWidth={1.8} />
      </button>
      <span className="settings-font-size-value">{fontSize}px</span>
      <button
        aria-label="Increase default font size"
        className="settings-font-size-button"
        disabled={disabled || atMax}
        onClick={onStepUp}
        type="button"
      >
        <ChevronUp size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}
