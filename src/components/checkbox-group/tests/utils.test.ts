import { describe, it, expect } from 'vitest';
import { normalizeCheckboxGroupValues, checkboxGroupValuesEqual } from '../utils';

describe('normalizeCheckboxGroupValues', () => {
  it('normalizes non-array input to an empty string array', () => {
    expect(normalizeCheckboxGroupValues(null)).to.deep.equal([]);
  });

  it('normalizes undefined to an empty string array', () => {
    expect(normalizeCheckboxGroupValues(undefined)).to.deep.equal([]);
  });

  it('normalizes a non-array value to an empty string array', () => {
    expect(normalizeCheckboxGroupValues('a')).to.deep.equal([]);
  });

  it('stringifies values and removes nullish entries', () => {
    expect(normalizeCheckboxGroupValues(['a', 2, null])).to.deep.equal(['a', '2']);
  });

  it('removes undefined entries', () => {
    expect(normalizeCheckboxGroupValues(['a', undefined, 'b'])).to.deep.equal(['a', 'b']);
  });

  it('returns an empty array for an empty array input', () => {
    expect(normalizeCheckboxGroupValues([])).to.deep.equal([]);
  });

  it('converts numeric values to strings', () => {
    expect(normalizeCheckboxGroupValues([1, 2, 3])).to.deep.equal(['1', '2', '3']);
  });
});

describe('checkboxGroupValuesEqual', () => {
  it('compares normalized arrays by value and order', () => {
    expect(checkboxGroupValuesEqual(['a'], ['a'])).to.equal(true);
  });

  it('returns false for arrays with different values', () => {
    expect(checkboxGroupValuesEqual(['a'], ['b'])).to.equal(false);
  });

  it('returns false for arrays with different lengths', () => {
    expect(checkboxGroupValuesEqual(['a', 'b'], ['a'])).to.equal(false);
  });

  it('returns false for arrays in different order', () => {
    expect(checkboxGroupValuesEqual(['a', 'b'], ['b', 'a'])).to.equal(false);
  });

  it('treats two empty arrays as equal', () => {
    expect(checkboxGroupValuesEqual([], [])).to.equal(true);
  });

  it('treats null and undefined as equal (both normalize to empty)', () => {
    expect(checkboxGroupValuesEqual(null, undefined)).to.equal(true);
  });

  it('treats null and empty array as equal', () => {
    expect(checkboxGroupValuesEqual(null, [])).to.equal(true);
  });
});
