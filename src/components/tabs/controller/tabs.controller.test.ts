import { expect, describe, it } from 'vitest';
import { TabsController } from './tabs.controller.js';
import type { TabsHostSnapshot } from '../types.js';

describe('TabsController', () => {
  function createController(snapshot?: Partial<TabsHostSnapshot>) {
    const controller = new TabsController();
    controller.syncFromHost({ value: undefined, defaultValue: null, disabled: false, ...snapshot });
    return controller;
  }

  describe('uncontrolled mode', () => {
    it('starts with no active value when no default and no tabs', () => {
      const ctrl = createController();
      expect(ctrl.activeValue).to.be.null;
    });

    it('seeds from defaultValue', () => {
      const ctrl = createController({ defaultValue: 'b' });
      expect(ctrl.activeValue).to.equal('b');
    });

    it('seeds defaultValue only once', () => {
      const ctrl = createController({ defaultValue: 'a' });
      ctrl.syncFromHost({ value: undefined, defaultValue: 'b', disabled: false });
      expect(ctrl.activeValue).to.equal('a');
    });

    it('requestActivation updates activeValue and sets previousValue', () => {
      const ctrl = createController({ defaultValue: 'a' });
      const result = ctrl.requestActivation('b');
      expect(result).to.equal('b');
      expect(ctrl.activeValue).to.equal('b');
      expect(ctrl.previousValue).to.equal('a');
    });
  });

  describe('controlled mode', () => {
    it('reflects externally set value', () => {
      const ctrl = createController({ value: 'b' });
      expect(ctrl.activeValue).to.equal('b');
    });

    it('does not update internal state on requestActivation', () => {
      const ctrl = createController({ value: 'a' });
      const result = ctrl.requestActivation('b');
      expect(result).to.equal('b');
      expect(ctrl.activeValue).to.equal('a');
    });

    it('value=null means no tab selected', () => {
      const ctrl = createController({ value: null });
      expect(ctrl.activeValue).to.be.null;
      expect(ctrl.isActive('a')).to.be.false;
    });
  });

  describe('disabled', () => {
    it('blocks activation when root is disabled', () => {
      const ctrl = createController({ disabled: true });
      const result = ctrl.requestActivation('a');
      expect(result).to.be.null;
    });
  });

  describe('isActive', () => {
    it('returns true for active value', () => {
      const ctrl = createController({ defaultValue: 'a' });
      expect(ctrl.isActive('a')).to.be.true;
      expect(ctrl.isActive('b')).to.be.false;
    });
  });
});
