import { expect, describe, it } from 'vitest';
import { ToggleGroupEngine } from '../toggle-group.engine.js';
import type { ToggleGroupHostSnapshot } from '../types.js';

describe('ToggleGroupEngine', () => {
  function create(snapshot?: Partial<ToggleGroupHostSnapshot>) {
    const ctrl = new ToggleGroupEngine();
    ctrl.syncFromHost({
      value: undefined,
      defaultValue: [],
      multiple: false,
      disabled: false,
      ...snapshot,
    });
    return ctrl;
  }

  describe('uncontrolled mode', () => {
    it('starts with no items pressed', () => {
      const ctrl = create();
      expect(ctrl.isPressed('a')).to.be.false;
    });

    it('seeds from defaultValue', () => {
      const ctrl = create({ defaultValue: ['a'] });
      expect(ctrl.isPressed('a')).to.be.true;
    });

    it('seeds defaultValue only once', () => {
      const ctrl = create({ defaultValue: ['a'] });
      ctrl.syncFromHost({ value: undefined, defaultValue: ['b'], multiple: false, disabled: false });
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.false;
    });

    it('requestToggle presses an item', () => {
      const ctrl = create();
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isPressed('a')).to.be.true;
    });

    it('requestToggle unpresses an already-pressed item', () => {
      const ctrl = create({ defaultValue: ['a'] });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal([]);
      expect(ctrl.isPressed('a')).to.be.false;
    });
  });

  describe('single mode', () => {
    it('unpresses the previously pressed item when pressing a new one', () => {
      const ctrl = create({ defaultValue: ['a'] });
      ctrl.requestToggle('b', false);
      expect(ctrl.isPressed('a')).to.be.false;
      expect(ctrl.isPressed('b')).to.be.true;
    });
  });

  describe('multiple mode', () => {
    it('allows multiple items pressed simultaneously', () => {
      const ctrl = create({ multiple: true, defaultValue: ['a'] });
      ctrl.requestToggle('b', false);
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.true;
    });
  });

  describe('disabled', () => {
    it('blocks toggle when root is disabled', () => {
      const ctrl = create({ disabled: true });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.be.null;
    });

    it('blocks toggle when individual toggle is disabled', () => {
      const ctrl = create();
      const result = ctrl.requestToggle('a', true);
      expect(result).to.be.null;
    });
  });

  describe('controlled mode', () => {
    it('does not update internal state on toggle', () => {
      const ctrl = create({ value: [] });
      ctrl.requestToggle('a', false);
      expect(ctrl.isPressed('a')).to.be.false;
    });

    it('reflects externally set value', () => {
      const ctrl = create({ value: ['a', 'b'] });
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.true;
      expect(ctrl.isPressed('c')).to.be.false;
    });

    it('requestToggle returns the new value set without persisting', () => {
      const ctrl = create({ value: [] });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isPressed('a')).to.be.false;
    });
  });
});
