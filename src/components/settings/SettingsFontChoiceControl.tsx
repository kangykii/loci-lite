import { EDITOR_FONT_OPTIONS, type EditorFontChoice } from '../../lib/editorFont';
import SegmentedControl from '../ui/SegmentedControl';

type SettingsFontChoiceControlProps = {
  disabled?: boolean;
  fontChoice: EditorFontChoice;
  onSelect: (choice: EditorFontChoice) => void;
};

export default function SettingsFontChoiceControl({
  disabled = false,
  fontChoice,
  onSelect,
}: SettingsFontChoiceControlProps) {
  return (
    <SegmentedControl
      aria-label="Editor font"
      disabled={disabled}
      onChange={onSelect}
      options={EDITOR_FONT_OPTIONS.map((option) => ({
        label: option.label,
        value: option.id,
      }))}
      value={fontChoice}
    />
  );
}
