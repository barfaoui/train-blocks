import { type ComponentPropsWithoutRef, useId } from 'react';

import styles from './TextInput.module.scss';
import { TypographySmall } from './Typography';

export type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'value' | 'onChange' | 'className' | 'required'>;

export function TextInput({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
  type = 'text',
  className,
  ...inputProps
}: TextInputProps) {
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
      <input
        {...inputProps}
        id={id}
        type={type}
        value={value}
        className={[styles.field, invalid ? styles['-invalid'] : undefined]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={invalid}
        aria-required={required || undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
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
