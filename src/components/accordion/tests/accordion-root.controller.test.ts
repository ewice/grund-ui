import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { AccordionRootController } from '../accordion-root.controller';
import type { AccordionHostSnapshot } from '../types';

interface MockHost extends ReactiveControllerHost, HTMLElement {
  addController: ReturnType<typeof vi.fn>;
}

function createHost(): MockHost {
  const el = document.createElement('div') as MockHost;
  el.addController = vi.fn();
  (el as any).requestUpdate = vi.fn();
  (el as any).removeController = vi.fn();
  (el as any).updateComplete = Promise.resolve(true);
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

    expect([...controller.contextValue.expandedItems]).toEqual(['item-2']);
  });
});
