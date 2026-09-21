import { describe, expect, it } from 'vitest';

import { firstEmoji } from './emoji.util';

describe('firstEmoji', () => {
  it.each(['🏃', '🏃🏽', '👨‍👩‍👧', '🇹🇳', '❤️'])('keeps the single emoji %s whole', (emoji) => {
    expect(firstEmoji(emoji)).toBe(emoji);
  });

  it('drops everything after the first emoji', () => {
    expect(firstEmoji('🏃 any text')).toBe('🏃');
    expect(firstEmoji('🏃🏊')).toBe('🏃');
    expect(firstEmoji('👨‍👩‍👧🏃')).toBe('👨‍👩‍👧');
  });

  it('ignores surrounding whitespace', () => {
    expect(firstEmoji('  🏃  ')).toBe('🏃');
  });

  it.each(['', '   ', 'star', 'A', '1', 'a🏃'])('returns null for %j', (value) => {
    expect(firstEmoji(value)).toBeNull();
  });
});
