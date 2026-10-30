import { countLeaveDays, isValidDate } from '../src/lib/dates';

describe('countLeaveDays', () => {
  it('counts a single day as 1', () => {
    expect(countLeaveDays('2026-11-03', '2026-11-03')).toBe(1);
  });

  it('counts 3 Nov to 5 Nov as 3', () => {
    expect(countLeaveDays('2026-11-03', '2026-11-05')).toBe(3);
  });

  it('counts across a month end (30 Nov to 2 Dec = 3)', () => {
    expect(countLeaveDays('2026-11-30', '2026-12-02')).toBe(3);
  });
});

describe('isValidDate', () => {
  it('accepts a real date', () => {
    expect(isValidDate('2026-02-28')).toBe(true);
  });

  it('rejects 2026-02-30', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
  });
});
