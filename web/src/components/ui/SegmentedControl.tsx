import type { LucideIcon } from 'lucide-react';
import styles from './SegmentedControl.module.css';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  hideLabel?: boolean;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <fieldset
      className={
        className ? `${styles.fieldset} ${className}` : styles.fieldset
      }
      aria-label={hideLabel ? label : undefined}
    >
      {!hideLabel && (
        <legend className={`field-label ${styles.legend}`}>{label}</legend>
      )}
      <div className={styles.group}>
        {options.map(
          ({ value: optionValue, label: optionLabel, icon: Icon }) => (
            <button
              key={optionValue}
              type="button"
              aria-pressed={optionValue === value}
              onClick={() => onChange(optionValue)}
              className={styles.option}
            >
              {Icon && <Icon size={16} aria-hidden="true" />}
              {optionLabel}
            </button>
          ),
        )}
      </div>
    </fieldset>
  );
}
