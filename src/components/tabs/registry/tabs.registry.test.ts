import { expect, describe, it, afterEach } from 'vitest';
import { TabsRegistry } from './tabs.registry.js';

describe('TabsRegistry', () => {
  function makeEl(id: string): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  afterEach(() => {
    document.body.querySelectorAll('div[id]').forEach((el) => el.remove());
  });

  it('registers a tab and retrieves the record', () => {
    const registry = new TabsRegistry();
    const tab = makeEl('tab-a');
    registry.registerTab('a', tab);
    const record = registry.getRecord('a');
    expect(record).to.exist;
    expect(record!.tab).to.equal(tab);
    expect(record!.panel).to.be.null;
  });

  it('registers a panel independently', () => {
    const registry = new TabsRegistry();
    const panel = makeEl('panel-a');
    registry.registerPanel('a', panel);
    const record = registry.getRecord('a');
    expect(record).to.exist;
    expect(record!.panel).to.equal(panel);
    expect(record!.tab).to.be.null;
  });

  it('completes a record when tab and panel register for same value', () => {
    const registry = new TabsRegistry();
    const tab = makeEl('tab-a');
    const panel = makeEl('panel-a');
    registry.registerTab('a', tab);
    registry.registerPanel('a', panel);
    const record = registry.getRecord('a');
    expect(record!.tab).to.equal(tab);
    expect(record!.panel).to.equal(panel);
  });

  it('unregisters a tab and clears tab reference, keeps panel', () => {
    const registry = new TabsRegistry();
    const tab = makeEl('tab-a');
    const panel = makeEl('panel-a');
    registry.registerTab('a', tab);
    registry.registerPanel('a', panel);
    registry.unregisterTab('a');
    const record = registry.getRecord('a');
    expect(record!.tab).to.be.null;
    expect(record!.panel).to.equal(panel);
  });

  it('removes record entirely when both tab and panel are unregistered', () => {
    const registry = new TabsRegistry();
    const tab = makeEl('tab-a');
    registry.registerTab('a', tab);
    registry.unregisterTab('a');
    expect(registry.getRecord('a')).to.be.undefined;
  });

  it('unregisters a panel and clears panel reference, keeps tab', () => {
    const registry = new TabsRegistry();
    const tab = makeEl('tab-a');
    const panel = makeEl('panel-a');
    registry.registerTab('a', tab);
    registry.registerPanel('a', panel);
    registry.unregisterPanel('a');
    const record = registry.getRecord('a');
    expect(record!.panel).to.be.null;
    expect(record!.tab).to.equal(tab);
  });

  it('getOrderedValues returns values sorted by tab DOM order', () => {
    const registry = new TabsRegistry();
    const tab1 = makeEl('tab-1');
    const tab2 = makeEl('tab-2');
    registry.registerTab('second', tab2);
    registry.registerTab('first', tab1);
    expect(registry.getOrderedValues()).to.deep.equal(['first', 'second']);
  });

  it('indexOf returns position in DOM order', () => {
    const registry = new TabsRegistry();
    const tab1 = makeEl('tab-1');
    const tab2 = makeEl('tab-2');
    registry.registerTab('a', tab1);
    registry.registerTab('b', tab2);
    expect(registry.indexOf('a')).to.equal(0);
    expect(registry.indexOf('b')).to.equal(1);
  });

  it('indexOf returns -1 for unknown value', () => {
    const registry = new TabsRegistry();
    expect(registry.indexOf('unknown')).to.equal(-1);
  });

  it('setDisabled updates the disabled flag on a record', () => {
    const registry = new TabsRegistry();
    const tab = makeEl('tab-a');
    registry.registerTab('a', tab);
    registry.setDisabled('a', true);
    expect(registry.getRecord('a')!.disabled).to.be.true;
  });

  it('getDisabledValues returns set of disabled values', () => {
    const registry = new TabsRegistry();
    const tab1 = makeEl('tab-1');
    const tab2 = makeEl('tab-2');
    registry.registerTab('a', tab1);
    registry.registerTab('b', tab2);
    registry.setDisabled('b', true);
    const disabled = registry.getDisabledValues();
    expect(disabled.has('b')).to.be.true;
    expect(disabled.has('a')).to.be.false;
  });

  it('getTabElement returns the tab element', () => {
    const registry = new TabsRegistry();
    const tab = makeEl('tab-a');
    registry.registerTab('a', tab);
    expect(registry.getTabElement('a')).to.equal(tab);
  });

  it('getPanelElement returns the panel element', () => {
    const registry = new TabsRegistry();
    const panel = makeEl('panel-a');
    registry.registerPanel('a', panel);
    expect(registry.getPanelElement('a')).to.equal(panel);
  });

  it('getTabElement returns null for unknown value', () => {
    const registry = new TabsRegistry();
    expect(registry.getTabElement('unknown')).to.be.null;
  });
});
