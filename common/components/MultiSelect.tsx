import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import styles from './MultiSelect.module.scss';
import selectStyles from './Select.module.scss';
import { TypographySmall } from '../styles/Typography';

export type MultiSelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type MultiSelectProps = {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  helperText?: string;
  className?: string;
};

const LIST_MAX_HEIGHT = 320;
const LIST_GAP = 4;
const VIEWPORT_PADDING = 8;

type ListPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'None selected',
  helperText,
  className,
}: MultiSelectProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<ListPosition | null>(null);
  // What was selected when the list opened. Those options are listed first, and the
  // order stays put while picking so the rows don't jump under the cursor.
  const [pinned, setPinned] = useState<string[]>([]);

  const orderedOptions = [
    ...options.filter((option) => pinned.includes(option.value)),
    ...options.filter((option) => !pinned.includes(option.value)),
  ];
  const trimmedQuery = query.trim().toLowerCase();
  const visibleOptions = trimmedQuery
    ? orderedOptions.filter((option) => option.label.toLowerCase().includes(trimmedQuery))
    : orderedOptions;
  const selectedOptions = value
    .map((selected) => options.find((option) => option.value === selected))
    .filter((option): option is MultiSelectOption => option !== undefined);

  const close = useCallback(() => {
    setOpen(false);
    setPosition(null);
    setQuery('');
  }, []);

  function toggle(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((selected) => selected !== optionValue)
        : [...value, optionValue],
    );
  }

  // Portaled and fixed-positioned so a scrolling ancestor can't clip the list.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - LIST_GAP - VIEWPORT_PADDING;
    const spaceAbove = rect.top - LIST_GAP - VIEWPORT_PADDING;
    const openUpwards = spaceBelow < Math.min(LIST_MAX_HEIGHT, 200) && spaceAbove > spaceBelow;

    setPosition({
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(LIST_MAX_HEIGHT, openUpwards ? spaceAbove : spaceBelow),
      ...(openUpwards
        ? { bottom: window.innerHeight - rect.top + LIST_GAP }
        : { top: rect.bottom + LIST_GAP }),
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        close();
      }
    }

    function handleScroll(event: Event) {
      if (!popupRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, close]);

  // A hidden popup can't take focus, so wait until it is positioned.
  useEffect(() => {
    if (open && position) {
      searchRef.current?.focus();
    }
  }, [open, position]);

  useEffect(() => {
    if (open && position) {
      popupRef.current
        ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, position, activeIndex]);

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const next = activeIndex + (event.key === 'ArrowDown' ? 1 : -1);
        setActiveIndex(Math.min(Math.max(next, 0), visibleOptions.length - 1));
        break;
      }
      case 'Enter':
        event.preventDefault();
        if (visibleOptions[activeIndex]) {
          toggle(visibleOptions[activeIndex].value);
        }
        break;
      case 'Escape':
        // Keep the Escape from also dismissing a surrounding modal.
        event.stopPropagation();
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case 'Tab':
        close();
        break;
    }
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <TypographySmall as="label" id={labelId} onClick={() => triggerRef.current?.focus()}>
        {label}
      </TypographySmall>
      <button
        ref={triggerRef}
        type="button"
        className={styles.field}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelId}
        onClick={() => {
          if (open) {
            close();
          } else {
            setActiveIndex(0);
            setPinned(value);
            setOpen(true);
          }
        }}
      >
        {selectedOptions.length > 0 ? (
          <span className={styles.chips}>
            {selectedOptions.map((option) => (
              <span key={option.value} className={styles.chip}>
                {option.icon ? <span className={styles.chipIcon}>{option.icon}</span> : null}
                {option.label}
              </span>
            ))}
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
      </button>
      {open
        ? createPortal(
            <div
              ref={popupRef}
              className={selectStyles.popup}
              style={{ ...position, visibility: position ? 'visible' : 'hidden' }}
            >
              <div className={selectStyles.searchBox}>
                <input
                  ref={searchRef}
                  type="text"
                  className={selectStyles.search}
                  value={query}
                  placeholder="Search…"
                  autoComplete="off"
                  role="searchbox"
                  aria-label={`Search ${label.toLowerCase()}`}
                  aria-controls={listId}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                />
                <span className={selectStyles.count} aria-live="polite">
                  {value.length} selected
                </span>
              </div>
              <ul
                id={listId}
                role="listbox"
                aria-multiselectable="true"
                aria-labelledby={labelId}
                className={selectStyles.list}
              >
                {visibleOptions.map((option, index) => {
                  const selected = value.includes(option.value);
                  return (
                    <li
                      key={option.value}
                      role="option"
                      data-index={index}
                      aria-selected={selected}
                      className={[
                        selectStyles.option,
                        index === activeIndex ? selectStyles['-active'] : undefined,
                        selected ? selectStyles['-selected'] : undefined,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => toggle(option.value)}
                    >
                      <span className={styles.check} aria-hidden="true">
                        {selected ? '✓' : ''}
                      </span>
                      {option.icon ? (
                        <span className={selectStyles.icon}>{option.icon}</span>
                      ) : null}
                      <span className={styles.optionLabel}>{option.label}</span>
                    </li>
                  );
                })}
                {visibleOptions.length === 0 ? (
                  <li className={selectStyles.empty} role="presentation">
                    No results
                  </li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}
      {helperText ? (
        <TypographySmall as="p" className={styles.helper}>
          {helperText}
        </TypographySmall>
      ) : null}
    </div>
  );
}
