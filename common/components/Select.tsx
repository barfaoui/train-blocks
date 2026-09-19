import {
  type ComponentPropsWithoutRef,
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

import { type InputWithHelperProps } from './input-props';
import styles from './Select.module.scss';
import { TypographySmall } from '../styles/Typography';

export type SelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type SelectProps = {
  options: SelectOption[];
  placeholder?: string;
} & InputWithHelperProps &
  Omit<
    ComponentPropsWithoutRef<'button'>,
    'id' | 'value' | 'onChange' | 'className' | 'required' | 'type' | 'children'
  >;

const LIST_MAX_HEIGHT = 288;
const LIST_GAP = 4;
const VIEWPORT_PADDING = 8;
const TYPEAHEAD_RESET_MS = 600;
// Lists longer than this get a search box.
const SEARCH_THRESHOLD = 4;

type ListPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  helperText,
  required,
  className,
  disabled,
  onKeyDown,
  ...buttonProps
}: SelectProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy = [helperText ? helperId : undefined, invalid ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: '', timer: 0 });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<ListPosition | null>(null);

  const searchable = options.length > SEARCH_THRESHOLD;
  const selectedOption = options.find((option) => option.value === value);
  const showPlaceholder = !selectedOption && Boolean(placeholder);

  // What the list shows: everything, or the options matching the search text.
  const trimmedQuery = query.trim().toLowerCase();
  const visibleOptions = trimmedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(trimmedQuery))
    : options;

  const openList = useCallback(
    (initialQuery = '') => {
      const initialIndex = options.findIndex((option) => option.value === value);
      setQuery(initialQuery);
      setActiveIndex(initialQuery ? 0 : Math.max(initialIndex, 0));
      setOpen(true);
    },
    [options, value],
  );

  const closeList = useCallback(() => {
    setOpen(false);
    setPosition(null);
    setQuery('');
  }, []);

  function updateQuery(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  function choose(index: number) {
    const option = visibleOptions[index];
    if (option) {
      onChange(option.value);
    }
    closeList();
    triggerRef.current?.focus();
  }

  // The list is portaled and fixed-positioned so a scrolling or clipping ancestor
  // (such as a modal body) can't cut it off.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - LIST_GAP - VIEWPORT_PADDING;
    const spaceAbove = rect.top - LIST_GAP - VIEWPORT_PADDING;
    const openUpwards = spaceBelow < Math.min(LIST_MAX_HEIGHT, 160) && spaceAbove > spaceBelow;

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
        closeList();
      }
    }

    function handleScroll(event: Event) {
      if (!popupRef.current?.contains(event.target as Node)) {
        closeList();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', closeList);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', closeList);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, closeList]);

  // The popup is hidden until positioned, and a hidden element can't take focus.
  useEffect(() => {
    if (open && position && searchable) {
      searchRef.current?.focus();
    }
  }, [open, position, searchable]);

  useEffect(() => {
    if (open && position) {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, position, activeIndex]);

  useEffect(() => () => window.clearTimeout(typeahead.current.timer), []);

  function moveActive(next: number) {
    setActiveIndex(Math.min(Math.max(next, 0), visibleOptions.length - 1));
  }

  function findByPrefix(text: string, from: number): number {
    const lower = text.toLowerCase();
    for (let offset = 0; offset < options.length; offset += 1) {
      const index = (from + offset) % options.length;
      if (options[index].label.toLowerCase().startsWith(lower)) {
        return index;
      }
    }
    return -1;
  }

  function handleTypeahead(character: string) {
    window.clearTimeout(typeahead.current.timer);
    typeahead.current.text += character;
    typeahead.current.timer = window.setTimeout(() => {
      typeahead.current.text = '';
    }, TYPEAHEAD_RESET_MS);

    const current = open ? activeIndex : options.findIndex((option) => option.value === value);
    // A repeated single letter cycles through matches; a longer prefix narrows them.
    const cycling = typeahead.current.text.split('').every((c) => c === character);
    const match = cycling
      ? findByPrefix(character, current + 1)
      : findByPrefix(typeahead.current.text, Math.max(current, 0));
    if (match < 0) {
      return;
    }
    if (open) {
      setActiveIndex(match);
    } else {
      onChange(options[match].value);
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) {
      return;
    }

    const printable =
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      event.key !== ' ';
    if (searchable && printable && !open) {
      // Typing on the closed field starts a search with that character.
      event.preventDefault();
      openList(event.key);
      return;
    }

    handleKeyDown(event, false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, fromSearch: boolean) {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) {
          openList();
        } else {
          moveActive(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
        }
        break;
      case 'Home':
      case 'End':
        // In the search box these keys move the text caret instead.
        if (open && !fromSearch) {
          event.preventDefault();
          moveActive(event.key === 'Home' ? 0 : options.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        if (fromSearch && event.key === ' ') {
          break;
        }
        event.preventDefault();
        if (!open) {
          openList();
        } else {
          choose(activeIndex);
        }
        break;
      case 'Escape':
        if (open) {
          // Keep the Escape from also dismissing a surrounding modal.
          event.stopPropagation();
          event.preventDefault();
          closeList();
        }
        break;
      case 'Tab':
        closeList();
        break;
      default:
        if (
          !searchable &&
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          handleTypeahead(event.key);
        }
    }
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {label ? (
        <TypographySmall as="label" id={labelId} onClick={() => triggerRef.current?.focus()}>
          {label}
          {required ? (
            <span className={styles.requiredAsterisk} aria-hidden="true">
              {' *'}
            </span>
          ) : null}
        </TypographySmall>
      ) : null}
      <button
        {...buttonProps}
        ref={triggerRef}
        type="button"
        role="combobox"
        disabled={disabled}
        className={[
          styles.field,
          showPlaceholder ? styles['-placeholder'] : undefined,
          invalid ? styles['-invalid'] : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={invalid}
        aria-required={required || undefined}
        aria-describedby={describedBy || undefined}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={handleTriggerKeyDown}
      >
        {selectedOption?.icon ? <span className={styles.icon}>{selectedOption.icon}</span> : null}
        <span className={styles.value}>
          {selectedOption ? selectedOption.label : (placeholder ?? '')}
        </span>
      </button>
      {open
        ? createPortal(
            <div
              ref={popupRef}
              className={styles.popup}
              style={{ ...position, visibility: position ? 'visible' : 'hidden' }}
            >
              {searchable ? (
                <div className={styles.searchBox}>
                  <input
                    ref={searchRef}
                    type="text"
                    className={styles.search}
                    value={query}
                    placeholder="Search…"
                    autoComplete="off"
                    role="searchbox"
                    aria-label="Search options"
                    aria-controls={listId}
                    aria-activedescendant={
                      activeIndex >= 0 && visibleOptions[activeIndex]
                        ? `${id}-option-${activeIndex}`
                        : undefined
                    }
                    onChange={(event) => updateQuery(event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, true)}
                  />
                  <span className={styles.count} aria-live="polite">
                    {visibleOptions.length}
                  </span>
                </div>
              ) : null}
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-labelledby={label ? labelId : undefined}
                aria-label={label ? undefined : buttonProps['aria-label']}
                className={styles.list}
              >
                {visibleOptions.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${id}-option-${index}`}
                    role="option"
                    data-index={index}
                    aria-selected={option.value === value}
                    className={[
                      styles.option,
                      index === activeIndex ? styles['-active'] : undefined,
                      option.value === value ? styles['-selected'] : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => choose(index)}
                  >
                    {option.icon ? <span className={styles.icon}>{option.icon}</span> : null}
                    <span className={styles.value}>{option.label}</span>
                  </li>
                ))}
                {visibleOptions.length === 0 ? (
                  <li className={styles.empty} role="presentation">
                    No results
                  </li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}
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
