import { expect, describe, it } from 'vitest';
import { AccordionController } from './accordion.controller.js';

import type { AccordionHostSnapshot } from '../types.js';

describe('AccordionController', () => {
  function createController(snapshot?: Partial<AccordionHostSnapshot>) {
    const controller = new AccordionController();
    controller.syncFromHost({
      value: undefined,
      defaultValue: undefined,
      multiple: false,
      disabled: false,
      ...snapshot,
    });
    return controller;
  }

  describe('uncontrolled mode', () => {
    it('starts with no items expanded', () => {
      const ctrl = createController();
      expect(ctrl.isExpanded('a')).to.be.false;
    });

    it('seeds from defaultValue', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      expect(ctrl.isExpanded('a')).to.be.true;
    });

    it('seeds defaultValue only once', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      // Re-sync with different defaultValue — should not reseed
      ctrl.syncFromHost({
        value: undefined,
        defaultValue: ['b'],
        multiple: false,
        disabled: false,
      });
      expect(ctrl.isExpanded('a')).to.be.true;
      expect(ctrl.isExpanded('b')).to.be.false;
    });

    it('requestToggle opens an item', () => {
      const ctrl = createController();
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: false });
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isExpanded('a')).to.be.true;
    });

    it('requestToggle closes an open item', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: false });
      expect(result).to.deep.equal([]);
      expect(ctrl.isExpanded('a')).to.be.false;
    });
  });

  describe('single mode', () => {
    it('closes other items when opening a new one', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      ctrl.requestToggle({ type: 'toggle', itemValue: 'b', itemDisabled: false });
      expect(ctrl.isExpanded('a')).to.be.false;
      expect(ctrl.isExpanded('b')).to.be.true;
    });
  });

  describe('multiple mode', () => {
    it('allows multiple items open', () => {
      const ctrl = createController({ multiple: true, defaultValue: ['a'] });
      ctrl.requestToggle({ type: 'toggle', itemValue: 'b', itemDisabled: false });
      expect(ctrl.isExpanded('a')).to.be.true;
      expect(ctrl.isExpanded('b')).to.be.true;
    });
  });

  describe('disabled', () => {
    it('blocks toggle when root is disabled', () => {
      const ctrl = createController({ disabled: true });
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: false });
      expect(result).to.be.null;
      expect(ctrl.isExpanded('a')).to.be.false;
    });

    it('blocks toggle when item is disabled', () => {
      const ctrl = createController();
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: true });
      expect(result).to.be.null;
      expect(ctrl.isExpanded('a')).to.be.false;
    });
  });

  describe('controlled mode', () => {
    it('does not update internal state', () => {
      const ctrl = createController({ value: [] });
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: false });
      expect(result).to.deep.equal(['a']);
      // Internal state should NOT change — consumer must set value
      expect(ctrl.isExpanded('a')).to.be.false;
    });

    it('reflects externally set value', () => {
      const ctrl = createController({ value: ['a', 'b'] });
      expect(ctrl.isExpanded('a')).to.be.true;
      expect(ctrl.isExpanded('b')).to.be.true;
      expect(ctrl.isExpanded('c')).to.be.false;
    });
  });
});
