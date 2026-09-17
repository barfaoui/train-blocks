import { type ComponentPropsWithoutRef, useId } from 'react';

import styles from './Select.module.scss';
import { TypographySmall } from '../styles/Typography';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<'select'>,
  'id' | 'value' | 'onChange' | 'className' | 'required'
>;

export function Select({
  label,
  value,
  onChange,
  options,
  error,
  helperText,
  required,
  className,
  ...selectProps
}: SelectProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy = [helperText ? helperId : undefined, invalid ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <TypographySmall as="label" htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.requiredAsterisk} aria-hidden="true">
            {' *'}
          </span>
        ) : null}
      </TypographySmall>
      <select
        {...selectProps}
        id={id}
        value={value}
        className={[styles.field, invalid ? styles['-invalid'] : undefined]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={invalid}
        aria-required={required || undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? (
        <TypographySmall as="p" id={helperId} className={styles.helper}>
          {helperText}
        </TypographySmall>
      ) : null}
      {error ? (
        <TypographySmall as="p" id={errorId} className={styles.error}>
          {error}
        </TypographySmall>
      ) : null}
    </div>
  );
}
