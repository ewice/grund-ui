import { expect, describe, it } from 'vitest';
import { ToggleGroupController } from './toggle-group.controller.js';
import type { ToggleGroupHostSnapshot } from '../types.js';

describe('ToggleGroupController', () => {
  function createController(snapshot?: Partial<ToggleGroupHostSnapshot>) {
    const ctrl = new ToggleGroupController();
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
      const ctrl = createController();
      expect(ctrl.isPressed('a')).to.be.false;
    });

    it('seeds from defaultValue', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      expect(ctrl.isPressed('a')).to.be.true;
    });

    it('seeds defaultValue only once', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      ctrl.syncFromHost({ value: undefined, defaultValue: ['b'], multiple: false, disabled: false });
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.false;
    });

    it('requestToggle presses an item', () => {
      const ctrl = createController();
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isPressed('a')).to.be.true;
    });

    it('requestToggle unpresses an already-pressed item', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal([]);
      expect(ctrl.isPressed('a')).to.be.false;
    });
  });

  describe('single mode', () => {
    it('unpresses the previously pressed item when pressing a new one', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      ctrl.requestToggle('b', false);
      expect(ctrl.isPressed('a')).to.be.false;
      expect(ctrl.isPressed('b')).to.be.true;
    });
  });

  describe('multiple mode', () => {
    it('allows multiple items pressed simultaneously', () => {
      const ctrl = createController({ multiple: true, defaultValue: ['a'] });
      ctrl.requestToggle('b', false);
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.true;
    });
  });

  describe('disabled', () => {
    it('blocks toggle when root is disabled', () => {
      const ctrl = createController({ disabled: true });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.be.null;
    });

    it('blocks toggle when individual toggle is disabled', () => {
      const ctrl = createController();
      const result = ctrl.requestToggle('a', true);
      expect(result).to.be.null;
    });
  });

  describe('controlled mode', () => {
    it('does not update internal state on toggle', () => {
      const ctrl = createController({ value: [] });
      ctrl.requestToggle('a', false);
      expect(ctrl.isPressed('a')).to.be.false;
    });

    it('reflects externally set value', () => {
      const ctrl = createController({ value: ['a', 'b'] });
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.true;
      expect(ctrl.isPressed('c')).to.be.false;
    });

    it('requestToggle returns the new value set without persisting', () => {
      const ctrl = createController({ value: [] });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isPressed('a')).to.be.false;
    });
  });
});
