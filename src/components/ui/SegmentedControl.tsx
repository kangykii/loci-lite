import type { CSSProperties } from 'react';

type SegmentedControlOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  'aria-label': string;
  disabled?: boolean;
  fullWidth?: boolean;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedControlOption<T>>;
  value: T;
};

export default function SegmentedControl<T extends string>({
  'aria-label': ariaLabel,
  disabled = false,
  fullWidth = false,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <div
      aria-label={ariaLabel}
      className={`segmented-control${disabled ? ' is-disabled' : ''}${fullWidth ? ' segmented-control--full' : ''}`}
      role="radiogroup"
      style={
        {
          '--segmented-active-index': activeIndex,
          '--segmented-count': options.length,
        } as CSSProperties
      }
    >
      <span aria-hidden="true" className="segmented-control__indicator" />
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            aria-checked={isActive}
            aria-label={option.label}
            className={`segmented-control__option${isActive ? ' is-active' : ''}`}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
