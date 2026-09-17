import { type ComponentPropsWithoutRef } from 'react';

import styles from './Button.module.scss';
import { TypographyLarge, TypographyMedium, TypographySmall } from '../styles/Typography';

export type ButtonVariant = 'primary' | 'incentivized' | 'dangerous';

export type ButtonStyle = 'normal' | 'big' | 'small';

export type ButtonProps = {
  label: string;
  fillHorizontally?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: ButtonVariant;
  outlined?: boolean;
  style?: ButtonStyle;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'disabled' | 'className' | 'style'>;

function Spinner() {
  return (
    <svg className={styles.spinnerSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  label,
  fillHorizontally = false,
  disabled = false,
  isLoading = false,
  variant = 'primary',
  outlined = false,
  style = 'normal',
  className,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const Label =
    style === 'big' ? TypographyLarge : style === 'small' ? TypographySmall : TypographyMedium;

  return (
    <Label
      as="button"
      variant={style === 'small' ? 'normal' : 'bold'}
      {...buttonProps}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={[
        styles.button,
        styles[`-${variant}`],
        outlined ? styles['-outlined'] : undefined,
        fillHorizontally ? styles['-fillHorizontally'] : undefined,
        style === 'big' ? styles['-big'] : undefined,
        style === 'small' ? styles['-small'] : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading ? <Spinner /> : null}
      {label}
    </Label>
  );
}
