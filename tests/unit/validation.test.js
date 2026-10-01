import { describe, expect, it } from 'vitest';
import {
  HOUSEHOLD_NAME_MAX,
  isValidEmail,
  isValidInviteCode,
  normalizeEmail,
  normalizeInviteCode,
  validateHouseholdName,
} from '../../src/domain/validation.js';

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

describe('invite code', () => {
  it.each(['3F9A0C1B', '3f9a0c1b', ' 3F9A-0C1B ', '3f9a 0c1b'])('accepts %j', (v) => {
    expect(isValidInviteCode(v)).toBe(true);
  });
  it.each(['', '3F9A0C1', '3F9A0C1BX', 'GGGGGGGG', '우리집코드입니다'])('rejects %j', (v) => {
    expect(isValidInviteCode(v)).toBe(false);
  });
  it('normalizes to uppercase without separators', () => {
    expect(normalizeInviteCode(' 3f9a-0c1b ')).toBe('3F9A0C1B');
  });
});

describe('validateHouseholdName', () => {
  it('requires non-blank name', () => {
    expect(validateHouseholdName('   ')).toContain('입력');
  });
  it('limits length', () => {
    expect(validateHouseholdName('가'.repeat(HOUSEHOLD_NAME_MAX + 1))).toContain('이하');
    expect(validateHouseholdName('가'.repeat(HOUSEHOLD_NAME_MAX))).toBeNull();
  });
  it('accepts normal names', () => {
    expect(validateHouseholdName(' 우리집 ')).toBeNull();
  });
});
