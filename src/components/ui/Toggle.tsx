type ToggleProps = {
  active: boolean;
  children: string;
  onToggle: () => void;
};

export default function Toggle({ active, children, onToggle }: ToggleProps) {
  return (
    <button aria-pressed={active} onClick={onToggle} type="button">
      {children}
    </button>
  );
}
