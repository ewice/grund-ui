import { describe, expect, it } from 'vitest';
import { AccordionRegistry } from './accordion.registry';
import type { GrundAccordionItemLike } from './types';


function createItem(value: string, disabled = false): GrundAccordionItemLike {
  const item = document.createElement('div') as GrundAccordionItemLike;
  item.value = value;
  item.disabled = disabled;
  return item;
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
