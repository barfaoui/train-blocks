import { type ComponentPropsWithoutRef, useId } from 'react';

import styles from './Checkbox.module.scss';
import { TypographySmall } from '../styles/Typography';

export type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'type' | 'checked' | 'onChange' | 'className'>;

export function Checkbox({ label, checked, onChange, className, ...inputProps }: CheckboxProps) {
  const id = useId();

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <input
        {...inputProps}
        id={id}
        type="checkbox"
        checked={checked}
        className={styles.field}
        onChange={(event) => onChange(event.target.checked)}
      />
      <TypographySmall as="label" htmlFor={id}>
        {label}
      </TypographySmall>
    </div>
  );
}
