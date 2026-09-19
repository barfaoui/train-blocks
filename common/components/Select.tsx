import { type ComponentPropsWithoutRef, useId } from 'react';

import { type InputWithHelperProps } from './input-props';
import styles from './Select.module.scss';
import { TypographySmall } from '../styles/Typography';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  options: SelectOption[];
  placeholder?: string;
} & InputWithHelperProps &
  Omit<ComponentPropsWithoutRef<'select'>, 'id' | 'value' | 'onChange' | 'className' | 'required'>;

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
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
      {label ? (
        <TypographySmall as="label" htmlFor={id}>
          {label}
          {required ? (
            <span className={styles.requiredAsterisk} aria-hidden="true">
              {' *'}
            </span>
          ) : null}
        </TypographySmall>
      ) : null}
      <select
        {...selectProps}
        id={id}
        value={value}
        className={[
          styles.field,
          placeholder && value === '' ? styles['-placeholder'] : undefined,
          invalid ? styles['-invalid'] : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={invalid}
        aria-required={required || undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
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
