import { type ReactNode, useId } from 'react';

import { TypographyLarge, TypographySmall } from '@common/styles/Typography';

import styles from './SectionCard.module.scss';

export type SectionCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  danger?: boolean;
  children?: ReactNode;
};

export function SectionCard({ title, description, actions, danger, children }: SectionCardProps) {
  const titleId = useId();

  return (
    <section
      className={[styles.card, danger ? styles['-danger'] : undefined].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <TypographyLarge as="h2" variant="bold" id={titleId} className={styles.title}>
            {title}
          </TypographyLarge>
          {description ? (
            <TypographySmall as="p" className={styles.description}>
              {description}
            </TypographySmall>
          ) : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
