import { describe, it, expect, vi } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { AccordionController } from './accordion.controller';

function createMockHost() {
  const host = {
    addController: vi.fn(),
    requestUpdate: vi.fn(),
    removeEventListener: vi.fn(),
    addEventListener: vi.fn(),
  };
  return host;
}

describe('AccordionController', () => {
  it('initializes with no expanded items', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost);
    expect(ctrl.expandedItems.size).toBe(0);
  });

  it('toggles an item in single mode', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
      type: 'single',
    });
    ctrl.toggle('item-1');
    expect(ctrl.expandedItems.has('item-1')).toBe(true);
  });

  it('collapses previous item in single mode', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
      type: 'single',
    });
    ctrl.toggle('item-1');
    ctrl.toggle('item-2');
    expect(ctrl.expandedItems.has('item-1')).toBe(false);
    expect(ctrl.expandedItems.has('item-2')).toBe(true);
  });

  it('does not collapse in single mode when collapsible is false', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
      type: 'single',
      collapsible: false,
    });
    ctrl.toggle('item-1');
    ctrl.toggle('item-1');
    expect(ctrl.expandedItems.has('item-1')).toBe(true);
  });

  it('collapses in single mode when collapsible is true', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
      type: 'single',
      collapsible: true,
    });
    ctrl.toggle('item-1');
    ctrl.toggle('item-1');
    expect(ctrl.expandedItems.has('item-1')).toBe(false);
  });

  it('toggles independently in multiple mode', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
      type: 'multiple',
    });
    ctrl.toggle('item-1');
    ctrl.toggle('item-2');
    expect(ctrl.expandedItems.has('item-1')).toBe(true);
    expect(ctrl.expandedItems.has('item-2')).toBe(true);
  });

  it('does not toggle a disabled item', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost);
    ctrl.setDisabledItems(new Set(['item-1']));
    ctrl.toggle('item-1');
    expect(ctrl.expandedItems.has('item-1')).toBe(false);
  });
});
