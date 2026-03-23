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

  it('registerTab inserts in DOM order', () => {
    const reg = new TabsRegistry();
    const a = makeEl('tab-a');
    const b = makeEl('tab-b');
    reg.registerTab(b, 'b');
    reg.registerTab(a, 'a');
    expect(reg.entries[0].value).to.equal('a');
    expect(reg.entries[1].value).to.equal('b');
  });

  it('getByValue returns the record', () => {
    const reg = new TabsRegistry();
    const a = makeEl('tab-a');
    reg.registerTab(a, 'a');
    expect(reg.getByValue('a')?.element).to.equal(a);
  });

  it('unregisterTab removes the record', () => {
    const reg = new TabsRegistry();
    const a = makeEl('tab-a');
    reg.registerTab(a, 'a');
    reg.unregisterTab('a');
    expect(reg.entries).to.have.length(0);
  });

  it('attachPanel upserts when tab not yet registered', () => {
    const reg = new TabsRegistry();
    const a = makeEl('tab-a');
    const panel = makeEl('panel-a');
    reg.attachPanel('a', panel); // panel registers first
    reg.registerTab(a, 'a'); // tab registers second
    expect(reg.getByValue('a')?.panel).to.equal(panel);
  });

  it('attachPanel merges with existing tab record', () => {
    const reg = new TabsRegistry();
    const a = makeEl('tab-a');
    const panel = makeEl('panel-a');
    reg.registerTab(a, 'a');
    reg.attachPanel('a', panel);
    expect(reg.getByValue('a')?.panel).to.equal(panel);
  });

  it('detachPanel sets panel to null', () => {
    const reg = new TabsRegistry();
    const a = makeEl('tab-a');
    const panel = makeEl('panel-a');
    reg.registerTab(a, 'a');
    reg.attachPanel('a', panel);
    reg.detachPanel('a');
    expect(reg.getByValue('a')?.panel).to.be.null;
  });

  it('indexOfValue returns correct index', () => {
    const reg = new TabsRegistry();
    const a = makeEl('tab-a');
    const b = makeEl('tab-b');
    reg.registerTab(a, 'a');
    reg.registerTab(b, 'b');
    expect(reg.indexOfValue('b')).to.equal(1);
  });

  it('firstNonDisabled skips elements with data-disabled', () => {
    const reg = new TabsRegistry();
    const a = makeEl('tab-a');
    const b = makeEl('tab-b');
    a.dataset.disabled = '';
    reg.registerTab(a, 'a');
    reg.registerTab(b, 'b');
    expect(reg.firstNonDisabled()?.value).to.equal('b');
  });
});
