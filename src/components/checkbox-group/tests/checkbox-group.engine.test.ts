import { expect, describe, it } from 'vitest';
import { CheckboxGroupEngine } from '../checkbox-group.engine';
import type { CheckboxGroupHostSnapshot } from '../types';

describe('CheckboxGroupEngine', () => {
  function create(overrides?: Partial<CheckboxGroupHostSnapshot>): CheckboxGroupEngine {
    const engine = new CheckboxGroupEngine();
    engine.syncFromHost({
      value: undefined,
      defaultValue: [],
      disabled: false,
      selectableValues: [],
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
        selectableValues: [],
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
        selectableValues: [],
      });
      expect(engine.isChecked('a')).to.be.false;
      expect(engine.checkedValues.size).to.equal(0);
    });

    it('requestToggle adds a value', () => {
      const engine = create();
      const result = engine.requestToggle('a');
      expect(result?.value).to.deep.equal(['a']);
      expect(result?.checked).to.equal(true);
      expect(engine.isChecked('a')).to.be.true;
    });

    it('requestToggle removes a checked value', () => {
      const engine = create({ defaultValue: ['a', 'b'] });
      const result = engine.requestToggle('a');
      expect(result?.value).to.include('b');
      expect(result?.value).to.not.include('a');
      expect(result?.checked).to.equal(false);
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
      expect(result?.value).to.include.members(['a', 'b']);
      expect(result?.checked).to.equal(true);
      expect(engine.isChecked('b')).to.be.false;
    });

  });

  describe('disabled', () => {
    it('requestToggle returns null when disabled', () => {
      const engine = create({ disabled: true });
      expect(engine.requestToggle('a')).to.be.null;
    });

    it('requestToggleAll returns null when disabled', () => {
      const engine = create({ disabled: true, selectableValues: ['a', 'b'] });
      expect(engine.requestToggleAll()).to.be.null;
    });
  });

  describe('getParentState', () => {
    it('returns "unchecked" when selectableValues is empty', () => {
      const engine = create({ selectableValues: [] });
      expect(engine.getParentState()).to.equal('unchecked');
    });

    it('returns "unchecked" when no selectableValues are checked', () => {
      const engine = create({ selectableValues: ['a', 'b', 'c'] });
      expect(engine.getParentState()).to.equal('unchecked');
    });

    it('returns "checked" when all selectableValues are checked', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'c'],
        selectableValues: ['a', 'b', 'c'],
      });
      expect(engine.getParentState()).to.equal('checked');
    });

    it('returns "indeterminate" when some selectableValues are checked', () => {
      const engine = create({
        defaultValue: ['a'],
        selectableValues: ['a', 'b', 'c'],
      });
      expect(engine.getParentState()).to.equal('indeterminate');
    });

    it('ignores checked values not in selectableValues', () => {
      const engine = create({
        defaultValue: ['a', 'extra'],
        selectableValues: ['a', 'b'],
      });
      // Only 'a' of ['a','b'] is checked → indeterminate
      expect(engine.getParentState()).to.equal('indeterminate');
    });

    it('does not change parent state when the caller mutates selectableValues after sync', () => {
      const selectableValues = ['a', 'b'];
      const engine = create({
        defaultValue: ['a', 'b'],
        selectableValues,
      });

      selectableValues.push('c');

      expect(engine.getParentState()).to.equal('checked');
    });
  });

  // ── Child registration (target architecture) ─────────────────────────────
  // The group element derives selectableValues from the registry and passes them
  // to the engine via syncFromHost({ selectableValues: [...] }). These tests verify the
  // engine correctly uses whatever selectableValues it receives.

  describe('child registration (target architecture)', () => {
    it('uses provided selectableValues as the selectable set', () => {
      const engine = create({ defaultValue: ['a', 'b'], selectableValues: ['a', 'b'] });
      expect(engine.getParentState()).to.equal('checked');
    });

    it('excludes parent (select-all) children — caller passes only non-parent values', () => {
      // The group element filters out parent checkboxes before passing selectableValues
      const engine = create({ defaultValue: ['a'], selectableValues: ['a', 'b'] });
      // Only 'a' of non-parent set {a, b} is checked → indeterminate
      expect(engine.getParentState()).to.equal('indeterminate');
    });

    it('updates parent state after re-sync with a reduced selectableValues set', () => {
      const engine = create({ defaultValue: ['a', 'b'], selectableValues: ['a', 'b'] });
      // Both checked → 'checked'
      expect(engine.getParentState()).to.equal('checked');
      // Simulate unregistering 'b': group re-syncs with selectableValues: ['a']
      engine.syncFromHost({
        value: undefined,
        defaultValue: ['a', 'b'],
        disabled: false,
        selectableValues: ['a'],
      });
      // Only 'a' remains in the selectable set, and it is checked → 'checked'
      expect(engine.getParentState()).to.equal('checked');
    });

    it('requestToggleAll uses selectableValues passed via syncFromHost', () => {
      const engine = create({ selectableValues: ['a', 'b'] });
      const result = engine.requestToggleAll();
      expect(result?.value).to.include.members(['a', 'b']);
      expect(result?.checked).to.equal(true);
    });

  });

  describe('requestToggleAll', () => {
    it('checks all when parent state is unchecked', () => {
      const engine = create({ selectableValues: ['a', 'b', 'c'] });
      const result = engine.requestToggleAll();
      expect(result?.value).to.include.members(['a', 'b', 'c']);
      expect(result?.checked).to.equal(true);
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
      expect(engine.isChecked('c')).to.be.true;
    });

    it('checks all when parent state is indeterminate', () => {
      const engine = create({
        defaultValue: ['a'],
        selectableValues: ['a', 'b', 'c'],
      });
      const result = engine.requestToggleAll();
      expect(result?.value).to.include.members(['a', 'b', 'c']);
      expect(result?.checked).to.equal(true);
    });

    it('unchecks all when parent state is checked', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'c'],
        selectableValues: ['a', 'b', 'c'],
      });
      const result = engine.requestToggleAll();
      expect(result?.value).to.deep.equal([]);
      expect(result?.checked).to.equal(false);
    });

    it('preserves values not in selectableValues when checking all', () => {
      const engine = create({
        defaultValue: ['extra'],
        selectableValues: ['a', 'b'],
      });
      const result = engine.requestToggleAll();
      expect(result?.value).to.include('extra');
      expect(result?.value).to.include('a');
      expect(result?.value).to.include('b');
      expect(result?.checked).to.equal(true);
    });

    it('preserves values not in selectableValues when unchecking all', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'extra'],
        selectableValues: ['a', 'b'],
      });
      const result = engine.requestToggleAll();
      expect(result?.value).to.deep.equal(['extra']);
      expect(result?.checked).to.equal(false);
    });
  });
});
