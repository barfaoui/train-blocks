import { type ComponentPropsWithoutRef, type ElementType } from 'react';

export type TypographyVariant = 'normal' | 'bold' | 'italic';

type TypographySize = 'TypographySmall' | 'TypographyMedium' | 'TypographyLarge';

type TypographyProps<T extends ElementType> = {
  as?: T;
  variant?: TypographyVariant;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'variant'>;

function typographyClassName(size: TypographySize, variant: TypographyVariant, className?: string) {
  return [size, variant === 'normal' ? undefined : variant, className].filter(Boolean).join(' ');
}

function TypographySmall<T extends ElementType = 'span'>({
  as,
  variant = 'normal',
  className,
  ...props
}: TypographyProps<T>) {
  const Component = as ?? 'span';
  return (
    <Component className={typographyClassName('TypographySmall', variant, className)} {...props} />
  );
}

function TypographyMedium<T extends ElementType = 'span'>({
  as,
  variant = 'normal',
  className,
  ...props
}: TypographyProps<T>) {
  const Component = as ?? 'span';
  return (
    <Component className={typographyClassName('TypographyMedium', variant, className)} {...props} />
  );
}

function TypographyLarge<T extends ElementType = 'span'>({
  as,
  variant = 'normal',
  className,
  ...props
}: TypographyProps<T>) {
  const Component = as ?? 'span';
  return (
    <Component className={typographyClassName('TypographyLarge', variant, className)} {...props} />
  );
}

export { TypographyLarge, TypographyMedium, TypographySmall };
