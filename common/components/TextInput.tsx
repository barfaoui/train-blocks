import { type ComponentPropsWithoutRef, useId, useState } from 'react';

import { type InputWithHelperProps } from './input-props';
import { ShowHideButton } from './ShowHideButton';
import styles from './TextInput.module.scss';
import { TypographySmall } from '../styles/Typography';

export type TextInputProps = InputWithHelperProps &
  Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'value' | 'onChange' | 'className' | 'required'>;

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
  const isPassword = type === 'password';
  const [passwordVisible, setPasswordVisible] = useState(false);
  const describedBy = [helperText ? helperId : undefined, invalid ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  const field = (
    <input
      {...inputProps}
      id={id}
      type={isPassword && passwordVisible ? 'text' : type}
      value={value}
      className={[
        styles.field,
        isPassword ? styles['-withToggle'] : undefined,
        invalid ? styles['-invalid'] : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-invalid={invalid}
      aria-required={required || undefined}
      aria-describedby={describedBy || undefined}
      onChange={(event) => onChange(event.target.value)}
    />
  );

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
      {isPassword ? (
        <div className={styles.fieldWrap}>
          {field}
          <ShowHideButton
            visible={passwordVisible}
            onToggle={() => setPasswordVisible((visible) => !visible)}
            controlsId={id}
            className={styles.toggleSlot}
          />
        </div>
      ) : (
        field
      )}
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
