import { expect, describe, it, vi } from 'vitest';
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

    it('does not change parent state when the caller mutates allValues after sync', () => {
      const allValues = ['a', 'b'];
      const engine = create({
        defaultValue: ['a', 'b'],
        allValues,
      });

      allValues.push('c');

      expect(engine.getParentState()).to.equal('checked');
    });
  });

  // ── Child registration (target architecture) ─────────────────────────────
  // These tests describe the intended engine behavior AFTER the allValues refactor.
  // They are expected to FAIL until child registration is wired into the engine.

  describe('child registration (target architecture)', () => {
    it('uses registered child values as the selectable set when allValues is not provided', () => {
      // Currently FAILS: engine has no registerChild API; allValues defaults to [] and
      // getParentState() returns 'unchecked' regardless of checked state.
      const engine = create({ defaultValue: ['a', 'b'] });
      // Simulate what registration would provide — engine must expose registerChild()
      (engine as any).registerChild('a', false);
      (engine as any).registerChild('b', false);
      expect(engine.getParentState()).to.equal('checked');
    });

    it('excludes parent (select-all) children from the derived selectable set', () => {
      // Currently FAILS: no registerChild API and no concept of parent exclusion
      const engine = create({ defaultValue: ['a'] });
      (engine as any).registerChild('all', true); // parent=true, should be excluded
      (engine as any).registerChild('a', false);
      (engine as any).registerChild('b', false);
      // Only 'a' of non-parent set {a, b} is checked → indeterminate
      expect(engine.getParentState()).to.equal('indeterminate');
    });

    it('updates parent state after a child is unregistered', () => {
      // Currently FAILS: no unregisterChild API
      const engine = create({ defaultValue: ['a', 'b'] });
      (engine as any).registerChild('a', false);
      (engine as any).registerChild('b', false);
      // Both checked → 'checked'
      expect(engine.getParentState()).to.equal('checked');
      // Remove 'b' from the registered set
      (engine as any).unregisterChild('b');
      // Only 'a' remains, and it is checked → 'checked' again (set is now just {a})
      expect(engine.getParentState()).to.equal('checked');
    });

    it('requestToggleAll uses derived child set, not allValues', () => {
      // Currently FAILS: requestToggleAll relies on _allValues which is populated via syncFromHost
      // After refactor, it should use the registered child set.
      const engine = create(); // no allValues
      (engine as any).registerChild('a', false);
      (engine as any).registerChild('b', false);
      const result = engine.requestToggleAll();
      expect(result?.value).to.include.members(['a', 'b']);
      expect(result?.checked).to.equal(true);
    });
  });

  // ── Migration behavior (target architecture) ──────────────────────────────
  // These tests describe compatibility behavior during/after the allValues migration.
  // They are expected to FAIL until the deprecation warnings are implemented.

  describe('migration behavior (target architecture)', () => {
    it('emits a console.warn deprecation notice when allValues is non-empty in syncFromHost', () => {
      // Currently FAILS: no deprecation warning is emitted anywhere
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const engine = new CheckboxGroupEngine();
      engine.syncFromHost({
        value: undefined,
        defaultValue: [],
        disabled: false,
        allValues: ['a', 'b'],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[grund-checkbox-group]'),
        expect.stringContaining('allValues'),
      );
      warnSpy.mockRestore();
    });
  });

  describe('requestToggleAll', () => {
    it('checks all when parent state is unchecked', () => {
      const engine = create({ allValues: ['a', 'b', 'c'] });
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
        allValues: ['a', 'b', 'c'],
      });
      const result = engine.requestToggleAll();
      expect(result?.value).to.include.members(['a', 'b', 'c']);
      expect(result?.checked).to.equal(true);
    });

    it('unchecks all when parent state is checked', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'c'],
        allValues: ['a', 'b', 'c'],
      });
      const result = engine.requestToggleAll();
      expect(result?.value).to.deep.equal([]);
      expect(result?.checked).to.equal(false);
    });

    it('preserves values not in allValues when checking all', () => {
      const engine = create({
        defaultValue: ['extra'],
        allValues: ['a', 'b'],
      });
      const result = engine.requestToggleAll();
      expect(result?.value).to.include('extra');
      expect(result?.value).to.include('a');
      expect(result?.value).to.include('b');
      expect(result?.checked).to.equal(true);
    });

    it('preserves values not in allValues when unchecking all', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'extra'],
        allValues: ['a', 'b'],
      });
      const result = engine.requestToggleAll();
      expect(result?.value).to.deep.equal(['extra']);
      expect(result?.checked).to.equal(false);
    });
  });
});
