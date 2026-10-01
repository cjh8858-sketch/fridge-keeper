import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from '../../src/domain/validation.js';

describe('isValidEmail', () => {
  it.each(['mom@example.com', ' Dad@Example.co.kr ', 'a.b+fridge@mail.net'])('accepts %s', (v) => {
    expect(isValidEmail(v)).toBe(true);
  });
  it.each(['', 'mom', 'mom@', '@example.com', 'mom@example', 'mo m@example.com', 'a@b.c'])(
    'rejects %j',
    (v) => {
      expect(isValidEmail(v)).toBe(false);
    },
  );
  it('rejects overly long addresses', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@ex.com`)).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Mom@Example.COM ')).toBe('mom@example.com');
  });
});
