import { Button } from './Button';
import styles from './NotFoundPage.module.scss';
import { TypographyLarge, TypographyMedium } from '../styles/Typography';

export type NotFoundPageProps = {
  homeHref: string;
};

export function NotFoundPage({ homeHref }: NotFoundPageProps) {
  return (
    <main className={styles.page}>
      <TypographyLarge as="p" variant="bold" className={styles.code} aria-hidden="true">
        404
      </TypographyLarge>
      <TypographyLarge as="h1" variant="bold" className={styles.title}>
        Page not found
      </TypographyLarge>
      <TypographyMedium as="p" className={styles.text}>
        This page doesn&apos;t exist, or it has moved.
      </TypographyMedium>
      <Button label="Back to home" onClick={() => window.location.assign(homeHref)} />
    </main>
  );
}
