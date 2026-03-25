import { expect, describe, it, afterEach } from 'vitest';
import { AccordionRegistry } from './accordion.registry.js';

describe('AccordionRegistry', () => {
  function makeEl(id: string): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  afterEach(() => {
    document.body.querySelectorAll('div[id]').forEach((el) => el.remove());
  });

  it('registers and retrieves items', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    registry.registerItem(item, 'a');
    expect(registry.items).to.have.length(1);
    expect(registry.items[0].value).to.equal('a');
  });

  it('maintains DOM order', () => {
    const registry = new AccordionRegistry();
    const item1 = makeEl('item-1');
    const item2 = makeEl('item-2');
    // Register in reverse order
    registry.registerItem(item2, 'second');
    registry.registerItem(item1, 'first');
    expect(registry.items[0].value).to.equal('first');
    expect(registry.items[1].value).to.equal('second');
  });

  it('unregisters items', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    registry.registerItem(item, 'a');
    registry.unregisterItem(item);
    expect(registry.items).to.have.length(0);
  });

  it('attaches and detaches trigger', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    const trigger = makeEl('trigger-a');
    registry.registerItem(item, 'a');
    registry.attachTrigger(item, trigger);
    expect(registry.getRecord(item)?.trigger).to.equal(trigger);
    registry.detachTrigger(item);
    expect(registry.getRecord(item)?.trigger).to.be.null;
  });

  it('attaches and detaches panel', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    const panel = makeEl('panel-a');
    registry.registerItem(item, 'a');
    registry.attachPanel(item, panel);
    expect(registry.getRecord(item)?.panel).to.equal(panel);
    registry.detachPanel(item);
    expect(registry.getRecord(item)?.panel).to.be.null;
  });

  it('indexOf returns correct position', () => {
    const registry = new AccordionRegistry();
    const item1 = makeEl('item-1');
    const item2 = makeEl('item-2');
    registry.registerItem(item1, 'first');
    registry.registerItem(item2, 'second');
    expect(registry.indexOf(item1)).to.equal(0);
    expect(registry.indexOf(item2)).to.equal(1);
  });

  it('indexOf returns -1 for unregistered item', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    expect(registry.indexOf(item)).to.equal(-1);
  });
});
