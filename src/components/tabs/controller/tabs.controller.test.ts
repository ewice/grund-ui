import { expect, describe, it } from 'vitest';
import { TabsController } from './tabs.controller.js';

describe('TabsController', () => {
  it('starts with null activeValue', () => {
    const ctrl = new TabsController();
    expect(ctrl.activeValue).to.be.null;
  });

  it('seeds activeValue from defaultValue once', () => {
    const ctrl = new TabsController();
    ctrl.syncFromHost({ value: undefined, defaultValue: 'a', disabled: false });
    expect(ctrl.activeValue).to.equal('a');
    // Second sync with different defaultValue does not re-seed
    ctrl.syncFromHost({ value: undefined, defaultValue: 'b', disabled: false });
    expect(ctrl.activeValue).to.equal('a');
  });

  it('controlled mode: syncFromHost sets activeValue from value', () => {
    const ctrl = new TabsController();
    ctrl.syncFromHost({ value: 'b', defaultValue: null, disabled: false });
    expect(ctrl.activeValue).to.equal('b');
  });

  it('controlled mode: requestActivate does not mutate activeValue', () => {
    const ctrl = new TabsController();
    ctrl.syncFromHost({ value: 'a', defaultValue: null, disabled: false });
    const result = ctrl.requestActivate('b', false);
    expect(result).to.equal('b');
    expect(ctrl.activeValue).to.equal('a'); // unchanged
  });

  it('uncontrolled mode: requestActivate mutates activeValue', () => {
    const ctrl = new TabsController();
    ctrl.syncFromHost({ value: undefined, defaultValue: null, disabled: false });
    ctrl.requestActivate('a', false); // auto-select path
    expect(ctrl.activeValue).to.equal('a');
  });

  it('returns null when tab is disabled', () => {
    const ctrl = new TabsController();
    ctrl.syncFromHost({ value: undefined, defaultValue: null, disabled: false });
    expect(ctrl.requestActivate('a', true)).to.be.null;
  });

  it('returns null when root is disabled', () => {
    const ctrl = new TabsController();
    ctrl.syncFromHost({ value: undefined, defaultValue: null, disabled: true });
    expect(ctrl.requestActivate('a', false)).to.be.null;
  });

  it('returns null when activating already-active value', () => {
    const ctrl = new TabsController();
    ctrl.syncFromHost({ value: undefined, defaultValue: 'a', disabled: false });
    expect(ctrl.requestActivate('a', false)).to.be.null;
  });
});
