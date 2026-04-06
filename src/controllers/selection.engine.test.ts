import { expect, describe, it } from 'vitest';
import { SelectionEngine } from './selection.engine.js';
import type { SelectionSnapshot } from './selection.engine.js';

describe('SelectionEngine', () => {
  function create(overrides?: Partial<SelectionSnapshot>): SelectionEngine {
    const ctrl = new SelectionEngine();
    ctrl.syncFromHost({
      value: undefined,
      defaultValue: undefined,
      multiple: false,
      disabled: false,
      ...overrides,
    });
    return ctrl;
  }

  describe('uncontrolled mode', () => {
    it('starts with no items selected', () => {
      const ctrl = create();
      expect(ctrl.isSelected('a')).to.be.false;
      expect(ctrl.selectedValues.size).to.equal(0);
    });

    it('seeds from defaultValue', () => {
      const ctrl = create({ defaultValue: ['a', 'b'] });
      expect(ctrl.isSelected('a')).to.be.true;
      expect(ctrl.isSelected('b')).to.be.true;
    });

    it('seeds defaultValue only once — re-sync with different defaultValue is ignored', () => {
      const ctrl = create({ defaultValue: ['a'] });
      ctrl.syncFromHost({
        value: undefined,
        defaultValue: ['b'],
        multiple: false,
        disabled: false,
      });
      expect(ctrl.isSelected('a')).to.be.true;
      expect(ctrl.isSelected('b')).to.be.false;
    });

    it('does not seed when defaultValue is empty array', () => {
      const ctrl = create({ defaultValue: [] });
      expect(ctrl.selectedValues.size).to.equal(0);
    });

    it('does not seed when defaultValue is undefined', () => {
      const ctrl = create({ defaultValue: undefined });
      expect(ctrl.selectedValues.size).to.equal(0);
    });

    it('requestToggle selects an item', () => {
      const ctrl = create();
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isSelected('a')).to.be.true;
    });

    it('requestToggle deselects an already-selected item', () => {
      const ctrl = create({ defaultValue: ['a'] });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal([]);
      expect(ctrl.isSelected('a')).to.be.false;
    });

    it('persists state between requestToggle calls', () => {
      const ctrl = create();
      ctrl.requestToggle('a', false);
      ctrl.requestToggle('b', false);
      // Single mode: b replaces a
      expect(ctrl.isSelected('a')).to.be.false;
      expect(ctrl.isSelected('b')).to.be.true;
    });
  });

  describe('single mode (multiple=false)', () => {
    it('selecting a new item deselects the previously selected one', () => {
      const ctrl = create({ defaultValue: ['a'] });
      ctrl.requestToggle('b', false);
      expect(ctrl.isSelected('a')).to.be.false;
      expect(ctrl.isSelected('b')).to.be.true;
    });

    it('deselecting the active item results in an empty selection', () => {
      const ctrl = create({ defaultValue: ['a'] });
      ctrl.requestToggle('a', false);
      expect(ctrl.selectedValues.size).to.equal(0);
    });
  });

  describe('multiple mode (multiple=true)', () => {
    it('allows multiple items selected simultaneously', () => {
      const ctrl = create({ multiple: true, defaultValue: ['a'] });
      ctrl.requestToggle('b', false);
      expect(ctrl.isSelected('a')).to.be.true;
      expect(ctrl.isSelected('b')).to.be.true;
    });

    it('deselecting one item in multiple mode leaves others selected', () => {
      const ctrl = create({ multiple: true, defaultValue: ['a', 'b'] });
      ctrl.requestToggle('a', false);
      expect(ctrl.isSelected('a')).to.be.false;
      expect(ctrl.isSelected('b')).to.be.true;
    });
  });

  describe('disabled', () => {
    it('blocks toggle when controller is disabled', () => {
      const ctrl = create({ disabled: true });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.be.null;
      expect(ctrl.isSelected('a')).to.be.false;
    });

    it('blocks toggle when the item is disabled', () => {
      const ctrl = create();
      const result = ctrl.requestToggle('a', true);
      expect(result).to.be.null;
      expect(ctrl.isSelected('a')).to.be.false;
    });

    it('item-disabled takes precedence even when controller is enabled', () => {
      const ctrl = create({ defaultValue: ['a'] });
      const result = ctrl.requestToggle('a', true);
      expect(result).to.be.null;
    });
  });

  describe('requestSet', () => {
    it('replaces selected values and returns new array', () => {
      const ctrl = create({ multiple: true, defaultValue: ['a'] });
      const result = ctrl.requestSet(['b', 'c']);
      expect(result).to.deep.equal(['b', 'c']);
    });

    it('updates internal state in uncontrolled mode', () => {
      const ctrl = create({ multiple: true, defaultValue: ['a'] });
      ctrl.requestSet(['b', 'c']);
      expect(ctrl.isSelected('a')).to.be.false;
      expect(ctrl.isSelected('b')).to.be.true;
      expect(ctrl.isSelected('c')).to.be.true;
    });

    it('does not update internal state in controlled mode', () => {
      const ctrl = create({ multiple: true, value: ['a'] });
      const result = ctrl.requestSet(['b', 'c']);
      expect(result).to.deep.equal(['b', 'c']);
      // Internal state unchanged — consumer owns the value
      expect(ctrl.isSelected('a')).to.be.true;
      expect(ctrl.isSelected('b')).to.be.false;
    });

    it('returns null when disabled', () => {
      const ctrl = create({ multiple: true, disabled: true });
      const result = ctrl.requestSet(['a', 'b']);
      expect(result).to.be.null;
    });

    it('handles empty array (deselect all)', () => {
      const ctrl = create({ multiple: true, defaultValue: ['a', 'b'] });
      const result = ctrl.requestSet([]);
      expect(result).to.deep.equal([]);
      expect(ctrl.isSelected('a')).to.be.false;
      expect(ctrl.isSelected('b')).to.be.false;
    });
  });

  describe('controlled mode', () => {
    it('reflects the provided value array', () => {
      const ctrl = create({ value: ['a', 'b'] });
      expect(ctrl.isSelected('a')).to.be.true;
      expect(ctrl.isSelected('b')).to.be.true;
      expect(ctrl.isSelected('c')).to.be.false;
    });

    it('requestToggle returns the new value set without persisting state', () => {
      const ctrl = create({ value: [] });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal(['a']);
      // Internal state must not change — consumer owns the value
      expect(ctrl.isSelected('a')).to.be.false;
    });

    it('updates to reflect new controlled value on each sync', () => {
      const ctrl = create({ value: ['a'] });
      ctrl.syncFromHost({
        value: ['b'],
        defaultValue: undefined,
        multiple: false,
        disabled: false,
      });
      expect(ctrl.isSelected('a')).to.be.false;
      expect(ctrl.isSelected('b')).to.be.true;
    });

    it('switching from uncontrolled to controlled adopts the provided value', () => {
      const ctrl = create({ defaultValue: ['a'] });
      ctrl.requestToggle('b', false); // uncontrolled: b now selected (single mode)
      // Consumer now takes control
      ctrl.syncFromHost({
        value: ['a', 'b'],
        defaultValue: undefined,
        multiple: true,
        disabled: false,
      });
      expect(ctrl.isSelected('a')).to.be.true;
      expect(ctrl.isSelected('b')).to.be.true;
    });
  });
});
