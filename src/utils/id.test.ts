import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('generates a string with the given prefix', () => {
    const id = generateId('trigger');
    expect(id).toMatch(/^trigger-/);
  });

  it('generates unique IDs across 100 calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId('test')));
    expect(ids.size).toBe(100);
  });

  it('generates unique IDs across separate calls with the same prefix', () => {
    const a = generateId('panel');
    const b = generateId('panel');
    expect(a).not.toBe(b);
  });
});
