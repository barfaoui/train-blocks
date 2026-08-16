import { type ComponentPropsWithoutRef, useId } from 'react';

import styles from './TextInput.module.css';
import { TypographySmall } from './Typography';

export type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'value' | 'onChange' | 'className'>;

export function TextInput({
  label,
  value,
  onChange,
  error,
  type = 'text',
  className,
  ...inputProps
}: TextInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = Boolean(error);

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <TypographySmall as="label" htmlFor={id}>
        {label}
      </TypographySmall>
      <input
        {...inputProps}
        id={id}
        type={type}
        value={value}
        className={[styles.field, invalid ? styles['field-invalid'] : undefined]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <TypographySmall as="p" id={errorId} className={styles.error}>
          {error}
        </TypographySmall>
      ) : null}
    </div>
  );
}
