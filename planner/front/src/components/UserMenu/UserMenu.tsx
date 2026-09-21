import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Avatar } from '@common/components/Avatar';
import { TypographySmall } from '@common/styles/Typography';

import styles from './UserMenu.module.scss';

export type UserMenuProps = {
  name: string;
  avatarIcon: string | null;
  avatarColor: string | null;
  onSignOut: () => void;
};

export function UserMenu({ name, avatarIcon, avatarColor, onSignOut }: UserMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <Avatar icon={avatarIcon} color={avatarColor} name={name} />
      </button>
      {open ? (
        <div id={menuId} role="menu" className={styles.menu}>
          <TypographySmall
            as={Link}
            to="/profile"
            role="menuitem"
            className={styles.item}
            onClick={() => setOpen(false)}
          >
            Profile
          </TypographySmall>
          <TypographySmall
            as="button"
            type="button"
            role="menuitem"
            className={[styles.item, styles['-danger']].join(' ')}
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            Sign out
          </TypographySmall>
        </div>
      ) : null}
    </div>
  );
}
