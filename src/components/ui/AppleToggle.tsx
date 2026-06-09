type AppleToggleProps = {
  checked: boolean;
  disabled?: boolean;
  id: string;
  label: string;
  layout?: 'menu-row' | 'switch-only';
  onChange: (checked: boolean) => void;
};

export default function AppleToggle({
  checked,
  disabled = false,
  id,
  label,
  layout = 'menu-row',
  onChange,
}: AppleToggleProps) {
  const labelId = `${id}-label`;

  const switchButton = (
    <button
      aria-checked={checked}
      aria-label={layout === 'switch-only' ? label : undefined}
      aria-labelledby={layout === 'menu-row' ? labelId : undefined}
      className={`apple-toggle ${checked ? 'is-on' : ''}`}
      disabled={disabled}
      id={id}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className="apple-toggle-track">
        <span className="apple-toggle-thumb" />
      </span>
    </button>
  );

  if (layout === 'switch-only') {
    return switchButton;
  }

  return (
    <div className="editor-bar-menu-row">
      <span className="editor-bar-menu-label" id={labelId}>
        {label}
      </span>
      {switchButton}
    </div>
  );
}
