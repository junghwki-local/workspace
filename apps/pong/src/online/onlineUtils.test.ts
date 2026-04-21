import { describe, it, expect } from 'vitest';
import { isValidPassword, defaultRoomTitle, randomCode, randomId } from './onlineUtils';

describe('isValidPassword', () => {
  it('4 digits is valid', () => expect(isValidPassword('1234')).toBe(true));
  it('0000 is valid',     () => expect(isValidPassword('0000')).toBe(true));
  it('9999 is valid',     () => expect(isValidPassword('9999')).toBe(true));
  it('3 digits invalid',  () => expect(isValidPassword('123')).toBe(false));
  it('5 digits invalid',  () => expect(isValidPassword('12345')).toBe(false));
  it('empty invalid',     () => expect(isValidPassword('')).toBe(false));
  it('letter invalid',    () => expect(isValidPassword('123a')).toBe(false));
  it('space invalid',     () => expect(isValidPassword('12 4')).toBe(false));
  it('special invalid',   () => expect(isValidPassword('12#4')).toBe(false));
});

describe('defaultRoomTitle', () => {
  it('non-empty', () => expect(defaultRoomTitle().length).toBeGreaterThan(0));
  it('contains 퐁', () => expect(defaultRoomTitle()).toContain('퐁'));
  it('ends with 4-digit number', () => {
    const m = defaultRoomTitle().match(/#(\d{4})$/);
    expect(m).not.toBeNull();
    const n = parseInt(m![1]);
    expect(n).toBeGreaterThanOrEqual(1000);
    expect(n).toBeLessThanOrEqual(9999);
  });
  it('max 30 chars', () => expect(defaultRoomTitle().length).toBeLessThanOrEqual(30));
  it('different results across calls', () => {
    const titles = new Set(Array.from({ length: 20 }, () => defaultRoomTitle()));
    expect(titles.size).toBeGreaterThan(1);
  });
});

describe('randomCode', () => {
  it('is 6 characters', () => expect(randomCode()).toHaveLength(6));
  it('only uppercase letters and digits', () => expect(randomCode()).toMatch(/^[A-Z2-9]{6}$/));
  it('different results across calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => randomCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('randomId', () => {
  it('is 16 characters', () => expect(randomId()).toHaveLength(16));
  it('only lowercase alphanumeric', () => expect(randomId()).toMatch(/^[a-z0-9]{16}$/));
  it('different results across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => randomId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});
