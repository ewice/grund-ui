import { describe, expect, it } from 'vitest';
import { AccordionRegistry } from './accordion.registry';
import type { GrundAccordionItemLike } from '../types';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';

function createItem(value: string, disabled = false): GrundAccordionItemLike {
  const item = document.createElement('div') as GrundAccordionItemLike;
  item.value = value;
  item.disabled = disabled;
  return item;
}

function createTrigger(): GrundAccordionTrigger {
  return document.createElement('button') as unknown as GrundAccordionTrigger;
}

describe('AccordionRegistry', () => {
  it('sorts items by DOM order and recomputes indices', () => {
    const registry = new AccordionRegistry();
    const host = document.createElement('div');
    const first = createItem('item-1');
    const second = createItem('item-2', true);

    host.append(first, second);
    registry.registerItem(second);
    registry.registerItem(first);
    registry.syncOrder();

    expect(registry.itemOrder).toEqual(['item-1', 'item-2']);
    expect(registry.getItemState(first)).toMatchObject({ index: 0, disabled: false });
    expect(registry.getItemState(second)).toMatchObject({ index: 1, disabled: true });
    expect(Array.from(registry.disabledValues)).toEqual(['item-2']);
  });

  it('attaches trigger and panel refs after the item is registered', () => {
    const registry = new AccordionRegistry();
    const item = createItem('item-1');
    const trigger = document.createElement('button');
    const panel = document.createElement('div');

    registry.registerItem(item);
    registry.attachTrigger(item, trigger);
    registry.attachPanel(item, panel);

    expect(registry.getItemState(item)).toMatchObject({
      trigger,
      panel,
    });
  });

  it('returns ordered trigger snapshots from registered items', () => {
    const registry = new AccordionRegistry();
    const host = document.createElement('div');
    const first = createItem('item-1');
    const second = createItem('item-2');
    const firstTrigger = createTrigger();
    const secondTrigger = createTrigger();

    host.append(first, second);
    registry.registerItem(second);
    registry.registerItem(first);
    registry.attachTrigger(first, firstTrigger);
    registry.attachTrigger(second, secondTrigger);

    expect(registry.getOrderedTriggers()).toEqual([firstTrigger, secondTrigger]);
  });

  it('updates ordered triggers after registered items are reordered', () => {
    const registry = new AccordionRegistry();
    const host = document.createElement('div');
    const first = createItem('item-1');
    const second = createItem('item-2');
    const firstTrigger = createTrigger();
    const secondTrigger = createTrigger();

    host.append(first, second);
    registry.registerItem(first);
    registry.registerItem(second);
    registry.attachTrigger(first, firstTrigger);
    registry.attachTrigger(second, secondTrigger);

    expect(registry.getOrderedTriggers()).toEqual([firstTrigger, secondTrigger]);

    host.insertBefore(second, first);

    expect(registry.getOrderedTriggers()).toEqual([secondTrigger, firstTrigger]);
  });

  it('keeps ordered trigger access snapshot-based', () => {
    const registry = new AccordionRegistry();
    const host = document.createElement('div');
    const first = createItem('item-1');
    const second = createItem('item-2');
    const firstTrigger = createTrigger();
    const secondTrigger = createTrigger();

    host.append(first, second);
    registry.registerItem(first);
    registry.registerItem(second);
    registry.attachTrigger(first, firstTrigger);

    const initialTriggers = registry.getOrderedTriggers();

    registry.attachTrigger(second, secondTrigger);

    expect(initialTriggers).toEqual([firstTrigger]);
    expect(registry.getOrderedTriggers()).toEqual([firstTrigger, secondTrigger]);
  });

  it('reflects item disabled change after syncOrder', () => {
    const registry = new AccordionRegistry();
    const item = createItem('item-1', false);

    registry.registerItem(item);
    expect(registry.getItemState(item)).toMatchObject({ disabled: false });

    item.disabled = true;
    registry.syncOrder();

    expect(registry.getItemState(item)).toMatchObject({ disabled: true });
  });

  it('reflects item value change after syncOrder', () => {
    const registry = new AccordionRegistry();
    const item = createItem('item-1');

    registry.registerItem(item);
    expect(registry.getItemState(item)?.value).toBe('item-1');

    item.value = 'renamed';
    registry.syncOrder();

    expect(registry.getItemState(item)?.value).toBe('renamed');
  });

  it('rejects duplicate item values', () => {
    const registry = new AccordionRegistry();
    const first = createItem('item-1');
    const second = createItem('item-1');

    registry.registerItem(first);

    expect(() => registry.registerItem(second)).toThrowError(
      /Duplicate accordion item value "item-1"/,
    );
  });
});
