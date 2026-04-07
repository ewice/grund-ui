import { expect, describe, it } from 'vitest';
import { CheckboxGroupEngine } from '../checkbox-group.engine.js';
import type { CheckboxGroupHostSnapshot } from '../types.js';

describe('CheckboxGroupEngine', () => {
  function create(overrides?: Partial<CheckboxGroupHostSnapshot>): CheckboxGroupEngine {
    const engine = new CheckboxGroupEngine();
    engine.syncFromHost({
      value: undefined,
      defaultValue: [],
      disabled: false,
      allValues: [],
      ...overrides,
    });
    return engine;
  }

  describe('uncontrolled mode', () => {
    it('starts with no items checked', () => {
      const engine = create();
      expect(engine.isChecked('a')).to.be.false;
      expect(engine.checkedValues.size).to.equal(0);
    });

    it('seeds from defaultValue', () => {
      const engine = create({ defaultValue: ['a', 'b'] });
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
    });

    it('seeds defaultValue only once', () => {
      const engine = create({ defaultValue: ['a'] });
      engine.syncFromHost({
        value: undefined,
        defaultValue: ['b'],
        disabled: false,
        allValues: [],
      });
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.false;
    });

    it('does not reseed uncontrolled state when first defaultValue is empty', () => {
      const engine = create({ defaultValue: [] });
      engine.syncFromHost({
        value: undefined,
        defaultValue: ['a'],
        disabled: false,
        allValues: [],
      });
      expect(engine.isChecked('a')).to.be.false;
      expect(engine.checkedValues.size).to.equal(0);
    });

    it('requestToggle adds a value', () => {
      const engine = create();
      const result = engine.requestToggle('a');
      expect(result).to.deep.equal(['a']);
      expect(engine.isChecked('a')).to.be.true;
    });

    it('requestToggle removes a checked value', () => {
      const engine = create({ defaultValue: ['a', 'b'] });
      const result = engine.requestToggle('a');
      expect(result).to.include('b');
      expect(result).to.not.include('a');
      expect(engine.isChecked('a')).to.be.false;
      expect(engine.isChecked('b')).to.be.true;
    });

    it('requestToggle persists state across calls (multi-mode)', () => {
      const engine = create();
      engine.requestToggle('a');
      engine.requestToggle('b');
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
    });
  });

  describe('controlled mode', () => {
    it('reflects the provided value array', () => {
      const engine = create({ value: ['a', 'b'] });
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
      expect(engine.isChecked('c')).to.be.false;
    });

    it('requestToggle returns new value without persisting state', () => {
      const engine = create({ value: ['a'] });
      const result = engine.requestToggle('b');
      expect(result).to.include.members(['a', 'b']);
      expect(engine.isChecked('b')).to.be.false;
    });
  });

  describe('disabled', () => {
    it('requestToggle returns null when disabled', () => {
      const engine = create({ disabled: true });
      expect(engine.requestToggle('a')).to.be.null;
    });

    it('requestToggleAll returns null when disabled', () => {
      const engine = create({ disabled: true, allValues: ['a', 'b'] });
      expect(engine.requestToggleAll()).to.be.null;
    });
  });

  describe('getParentState', () => {
    it('returns "unchecked" when allValues is empty', () => {
      const engine = create({ allValues: [] });
      expect(engine.getParentState()).to.equal('unchecked');
    });

    it('returns "unchecked" when no allValues are checked', () => {
      const engine = create({ allValues: ['a', 'b', 'c'] });
      expect(engine.getParentState()).to.equal('unchecked');
    });

    it('returns "checked" when all allValues are checked', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'c'],
        allValues: ['a', 'b', 'c'],
      });
      expect(engine.getParentState()).to.equal('checked');
    });

    it('returns "indeterminate" when some allValues are checked', () => {
      const engine = create({
        defaultValue: ['a'],
        allValues: ['a', 'b', 'c'],
      });
      expect(engine.getParentState()).to.equal('indeterminate');
    });

    it('ignores checked values not in allValues', () => {
      const engine = create({
        defaultValue: ['a', 'extra'],
        allValues: ['a', 'b'],
      });
      // Only 'a' of ['a','b'] is checked → indeterminate
      expect(engine.getParentState()).to.equal('indeterminate');
    });
  });

  describe('requestToggleAll', () => {
    it('checks all when parent state is unchecked', () => {
      const engine = create({ allValues: ['a', 'b', 'c'] });
      const result = engine.requestToggleAll();
      expect(result).to.include.members(['a', 'b', 'c']);
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
      expect(engine.isChecked('c')).to.be.true;
    });

    it('checks all when parent state is indeterminate', () => {
      const engine = create({
        defaultValue: ['a'],
        allValues: ['a', 'b', 'c'],
      });
      const result = engine.requestToggleAll();
      expect(result).to.include.members(['a', 'b', 'c']);
    });

    it('unchecks all when parent state is checked', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'c'],
        allValues: ['a', 'b', 'c'],
      });
      const result = engine.requestToggleAll();
      expect(result).to.deep.equal([]);
    });

    it('preserves values not in allValues when checking all', () => {
      const engine = create({
        defaultValue: ['extra'],
        allValues: ['a', 'b'],
      });
      const result = engine.requestToggleAll();
      expect(result).to.include('extra');
      expect(result).to.include('a');
      expect(result).to.include('b');
    });

    it('preserves values not in allValues when unchecking all', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'extra'],
        allValues: ['a', 'b'],
      });
      const result = engine.requestToggleAll();
      expect(result).to.deep.equal(['extra']);
    });
  });
});
