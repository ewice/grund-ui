import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { AccordionRootController } from '../root/accordion-root.controller';
import type { AccordionHostSnapshot, GrundAccordionItemLike } from '../types';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';

interface MockHost extends ReactiveControllerHost, HTMLElement {
  addController: ReturnType<typeof vi.fn>;
}

function createHost(): MockHost {
  const el = document.createElement('div') as MockHost;
  el.addController = vi.fn();
  (el as any).requestUpdate = vi.fn();
  (el as any).removeController = vi.fn();
  (el as any).updateComplete = Promise.resolve(true);
  el.dispatchEvent = vi.fn(el.dispatchEvent.bind(el));
  return el;
}

function createSnapshot(
  overrides: Partial<AccordionHostSnapshot> = {},
): AccordionHostSnapshot {
  return {
    multiple: false,
    value: undefined,
    defaultValue: undefined,
    disabled: false,
    orientation: 'vertical',
    loopFocus: true,
    keepMounted: false,
    hiddenUntilFound: false,
    ...overrides,
  };
}

function registerDisabledItem(controller: AccordionRootController): {
  disabledItem: GrundAccordionItemLike;
} {
  const disabledItem = document.createElement('div') as GrundAccordionItemLike;
  disabledItem.value = 'item-disabled';
  disabledItem.disabled = true;
  controller.contextValue.registerItem(disabledItem);
  return { disabledItem };
}

function createItem(value: string, disabled = false): GrundAccordionItemLike {
  const item = document.createElement('div') as GrundAccordionItemLike;
  item.value = value;
  item.disabled = disabled;
  return item;
}

function createTrigger(): GrundAccordionTrigger {
  return document.createElement('button') as unknown as GrundAccordionTrigger;
}

describe('AccordionRootController', () => {
  let host: MockHost;

  beforeEach(() => {
    host = createHost();
  });

  it('seeds uncontrolled state from defaultValue once', () => {
    const controller = new AccordionRootController(host);

    controller.syncFromHost(
      createSnapshot({
        value: undefined,
        defaultValue: 'item-2',
      }),
    );

    expect(controller.contextValue.expandedItems).toEqual(new Set(['item-2']));

    controller.syncFromHost(
      createSnapshot({
        value: undefined,
        defaultValue: 'item-1',
      }),
    );

    expect(controller.contextValue.expandedItems).toEqual(new Set(['item-2']));
  });

  it('preserves descendant aliases in contextValue', () => {
    const controller = new AccordionRootController(host);

    controller.syncFromHost(createSnapshot());

    expect(controller.contextValue.toggle).toBeTypeOf('function');
    expect(controller.contextValue.openItem).toBeTypeOf('function');
  });

  it('renames an expanded value without reseeding state', () => {
    const controller = new AccordionRootController(host);

    controller.syncFromHost(
      createSnapshot({
        defaultValue: 'item-1',
      }),
    );

    controller.renameExpandedValue('item-1', 'item-2');

    controller.syncFromHost(
      createSnapshot({
        defaultValue: 'item-3',
      }),
    );

    expect([...controller.contextValue.expandedItems]).toEqual(['item-2']);
  });

  it('dispatches grund-change and grund-value-change on toggle', () => {
    const controller = new AccordionRootController(host);

    controller.syncFromHost(createSnapshot());

    controller.contextValue.requestToggle('item-1');

    expect(host.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'grund-change' }),
    );
    expect(host.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'grund-value-change' }),
    );
  });

  it('does not mutate uncontrolled state when the host is controlled', () => {
    const controller = new AccordionRootController(createHost());

    controller.syncFromHost(createSnapshot({ value: 'item-1' }));

    controller.contextValue.requestToggle('item-2');

    expect([...controller.contextValue.expandedItems]).toEqual(['item-1']);
  });

  it('does nothing when the root is disabled', () => {
    const controller = new AccordionRootController(host);

    controller.syncFromHost(createSnapshot({ disabled: true }));

    controller.contextValue.requestToggle('item-1');

    expect([...controller.contextValue.expandedItems]).toEqual([]);
    expect(host.dispatchEvent).not.toHaveBeenCalled();
  });

  it('does nothing when the target item is disabled in the registry', () => {
    const controller = new AccordionRootController(host);
    const { disabledItem } = registerDisabledItem(controller);

    controller.syncFromHost(createSnapshot());

    controller.contextValue.requestToggle(disabledItem.value);

    expect([...controller.contextValue.expandedItems]).toEqual([]);
    expect(host.dispatchEvent).not.toHaveBeenCalled();
  });

  it('rejects duplicate item values through the controller registry path', () => {
    const controller = new AccordionRootController(host);
    const first = createItem('item-1');
    const second = createItem('item-1');

    controller.contextValue.registerItem(first);

    expect(() => controller.contextValue.registerItem(second)).toThrowError(
      /Duplicate accordion item value "item-1"/,
    );
  });

  it('re-reads disabled item state from the registry before resolving actions', () => {
    const controller = new AccordionRootController(host);
    const item = createItem('item-1');

    controller.contextValue.registerItem(item);
    controller.syncFromHost(createSnapshot());

    item.disabled = true;
    controller.contextValue.requestToggle(item.value);

    expect([...controller.contextValue.expandedItems]).toEqual([]);
    expect(host.dispatchEvent).not.toHaveBeenCalled();
  });

  it('exposes ordered triggers from the registry', () => {
    const controller = new AccordionRootController(host);
    const container = document.createElement('div');
    const first = createItem('item-1');
    const second = createItem('item-2');
    const firstTrigger = createTrigger();
    const secondTrigger = createTrigger();

    container.append(first, second);
    controller.contextValue.registerItem(second);
    controller.contextValue.registerItem(first);
    controller.contextValue.attachTrigger(first, firstTrigger);
    controller.contextValue.attachTrigger(second, secondTrigger);

    expect(controller.triggers).toEqual([firstTrigger, secondTrigger]);
  });

  it('updates trigger ordering after registered items are reordered', () => {
    const controller = new AccordionRootController(host);
    const container = document.createElement('div');
    const first = createItem('item-1');
    const second = createItem('item-2');
    const firstTrigger = createTrigger();
    const secondTrigger = createTrigger();

    container.append(first, second);
    controller.contextValue.registerItem(first);
    controller.contextValue.registerItem(second);
    controller.contextValue.attachTrigger(first, firstTrigger);
    controller.contextValue.attachTrigger(second, secondTrigger);

    expect(controller.triggers).toEqual([firstTrigger, secondTrigger]);

    container.insertBefore(second, first);

    expect(controller.triggers).toEqual([secondTrigger, firstTrigger]);
  });
});
