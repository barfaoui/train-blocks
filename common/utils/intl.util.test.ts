import { describe, expect, it } from 'vitest';

import { canonicalLocale, canonicalTimeZone } from './intl.util';

describe('canonicalLocale', () => {
  it('canonicalizes a valid tag', () => {
    expect(canonicalLocale('fr-fr')).toBe('fr-FR');
  });

  it.each([undefined, '', 'not a locale!', 'en-US-x-aaaaaaaaaaaa'])('rejects %j', (value) => {
    expect(canonicalLocale(value)).toBeUndefined();
  });
});

describe('canonicalTimeZone', () => {
  it('canonicalizes a valid zone', () => {
    expect(canonicalTimeZone('europe/paris')).toBe('Europe/Paris');
  });

  it.each([undefined, '', 'Mars/Olympus', `Europe/${'a'.repeat(70)}`])('rejects %j', (value) => {
    expect(canonicalTimeZone(value)).toBeUndefined();
  });
});
