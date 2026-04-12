import { expect, describe, it } from 'vitest';
import { TabsEngine } from '../tabs.engine';
import type { TabsHostSnapshot } from '../types';

describe('TabsEngine', () => {
  function create(snapshot?: Partial<TabsHostSnapshot>) {
    const controller = new TabsEngine();
    controller.syncFromHost({ value: undefined, defaultValue: null, disabled: false, ...snapshot });
    return controller;
  }

  describe('uncontrolled mode', () => {
    it('starts with no active value when no default and no tabs', () => {
      const ctrl = create();
      expect(ctrl.activeValue).to.be.null;
    });

    it('seeds from defaultValue', () => {
      const ctrl = create({ defaultValue: 'b' });
      expect(ctrl.activeValue).to.equal('b');
    });

    it('seeds defaultValue only once', () => {
      const ctrl = create({ defaultValue: 'a' });
      ctrl.syncFromHost({ value: undefined, defaultValue: 'b', disabled: false });
      expect(ctrl.activeValue).to.equal('a');
    });

    it('requestActivation updates activeValue and sets previousValue', () => {
      const ctrl = create({ defaultValue: 'a' });
      const result = ctrl.requestActivation('b');
      expect(result).to.equal('b');
      expect(ctrl.activeValue).to.equal('b');
      expect(ctrl.previousValue).to.equal('a');
    });
  });

  describe('controlled mode', () => {
    it('reflects externally set value', () => {
      const ctrl = create({ value: 'b' });
      expect(ctrl.activeValue).to.equal('b');
    });

    it('does not update internal state on requestActivation', () => {
      const ctrl = create({ value: 'a' });
      const result = ctrl.requestActivation('b');
      expect(result).to.equal('b');
      expect(ctrl.activeValue).to.equal('a');
    });

    it('value=null means no tab selected', () => {
      const ctrl = create({ value: null });
      expect(ctrl.activeValue).to.be.null;
      expect(ctrl.isActive('a')).to.be.false;
    });
  });

  describe('disabled', () => {
    it('blocks activation when root is disabled', () => {
      const ctrl = create({ disabled: true });
      const result = ctrl.requestActivation('a');
      expect(result).to.be.null;
    });
  });

  describe('isActive', () => {
    it('returns true for active value', () => {
      const ctrl = create({ defaultValue: 'a' });
      expect(ctrl.isActive('a')).to.be.true;
      expect(ctrl.isActive('b')).to.be.false;
    });
  });
});
