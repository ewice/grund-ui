import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { RovingFocusController } from './roving-focus.controller';

function createMockHost(): ReactiveControllerHost & Element {
  const el = document.createElement('div');
  (el as any).addController = vi.fn();
  (el as any).requestUpdate = vi.fn();
  (el as any).removeController = vi.fn();
  (el as any).updateComplete = Promise.resolve(true);
  return el as unknown as ReactiveControllerHost & Element;
}

function createButton(disabled = false): HTMLButtonElement {
  const btn = document.createElement('button');
  if (disabled) btn.disabled = true;
  return btn;
}

interface MockItem {
  button: HTMLButtonElement;
  disabled: boolean;
}

function createItem(disabled = false): MockItem {
  return { button: createButton(disabled), disabled };
}

describe('RovingFocusController', () => {
  let host: ReactiveControllerHost & Element;

  beforeEach(() => {
    host = createMockHost();
  });

  describe('syncTabindex', () => {
    it('sets tabindex=0 on first enabled item, -1 on others', () => {
      const items = [createItem(), createItem(), createItem()];
      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });

      ctrl.hostUpdated();

      expect(items[0].button.tabIndex).toBe(0);
      expect(items[1].button.tabIndex).toBe(-1);
      expect(items[2].button.tabIndex).toBe(-1);
    });

    it('skips disabled items for initial tabindex=0', () => {
      const items = [createItem(true), createItem(), createItem()];
      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });

      ctrl.hostUpdated();

      expect(items[0].button.tabIndex).toBe(-1);
      expect(items[1].button.tabIndex).toBe(0);
      expect(items[2].button.tabIndex).toBe(-1);
    });

    it('re-syncs on every hostUpdated (dynamic items)', () => {
      const items = [createItem(), createItem()];
      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });

      ctrl.hostUpdated();
      expect(items[0].button.tabIndex).toBe(0);

      // Add a new item at front
      const newItem = createItem();
      items.unshift(newItem);
      ctrl.hostUpdated();

      expect(newItem.button.tabIndex).toBe(0);
      expect(items[1].button.tabIndex).toBe(-1);
    });
  });

  describe('handleKeyDown', () => {
    it('moves focus forward on ArrowDown (vertical)', () => {
      const items = [createItem(), createItem(), createItem()];
      document.body.append(items[0].button, items[1].button, items[2].button);

      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
        orientation: 'vertical',
      });
      ctrl.hostUpdated();

      const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[0].button] });
      ctrl.handleKeyDown(e);

      expect(e.defaultPrevented).toBe(true);
      expect(items[0].button.tabIndex).toBe(-1);
      expect(items[1].button.tabIndex).toBe(0);

      items.forEach((i) => i.button.remove());
    });

    it('ignores ArrowLeft/Right in vertical mode', () => {
      const items = [createItem(), createItem()];

      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
        orientation: 'vertical',
      });
      ctrl.hostUpdated();

      const e = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[0].button] });
      ctrl.handleKeyDown(e);

      expect(e.defaultPrevented).toBe(false);
    });

    it('moves focus forward on ArrowRight (horizontal)', () => {
      const items = [createItem(), createItem()];
      document.body.append(items[0].button, items[1].button);

      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
        orientation: 'horizontal',
      });
      ctrl.hostUpdated();

      const e = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[0].button] });
      ctrl.handleKeyDown(e);

      expect(e.defaultPrevented).toBe(true);
      expect(items[1].button.tabIndex).toBe(0);

      items.forEach((i) => i.button.remove());
    });

    it('moves focus to first item on Home', () => {
      const items = [createItem(), createItem(), createItem()];
      document.body.append(...items.map((i) => i.button));

      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });
      ctrl.hostUpdated();

      const e = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[2].button] });
      ctrl.handleKeyDown(e);

      expect(items[0].button.tabIndex).toBe(0);
      expect(items[2].button.tabIndex).toBe(-1);

      items.forEach((i) => i.button.remove());
    });

    it('moves focus to last item on End', () => {
      const items = [createItem(), createItem(), createItem()];
      document.body.append(...items.map((i) => i.button));

      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });
      ctrl.hostUpdated();

      const e = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[0].button] });
      ctrl.handleKeyDown(e);

      expect(items[2].button.tabIndex).toBe(0);
      expect(items[0].button.tabIndex).toBe(-1);

      items.forEach((i) => i.button.remove());
    });

    it('wraps from last to first on ArrowDown', () => {
      const items = [createItem(), createItem()];
      document.body.append(...items.map((i) => i.button));

      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });
      ctrl.hostUpdated();

      const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[1].button] });
      ctrl.handleKeyDown(e);

      expect(items[0].button.tabIndex).toBe(0);

      items.forEach((i) => i.button.remove());
    });

    it('stops at the edge when looping is disabled', () => {
      const items = [createItem(), createItem()];
      document.body.append(...items.map((i) => i.button));

      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
        loop: false,
      });
      ctrl.hostUpdated();

      const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[1].button] });
      ctrl.handleKeyDown(e);

      expect(items[1].button.tabIndex).toBe(0);
      expect(items[0].button.tabIndex).toBe(-1);

      items.forEach((i) => i.button.remove());
    });

    it('skips disabled items during navigation', () => {
      const items = [createItem(), createItem(true), createItem()];
      document.body.append(...items.map((i) => i.button));

      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });
      ctrl.hostUpdated();

      const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[0].button] });
      ctrl.handleKeyDown(e);

      expect(items[2].button.tabIndex).toBe(0);

      items.forEach((i) => i.button.remove());
    });

    it('does not preventDefault for non-navigation keys', () => {
      const items = [createItem()];
      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });

      const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'composedPath', { value: () => [items[0].button] });
      ctrl.handleKeyDown(e);

      expect(e.defaultPrevented).toBe(false);
    });
  });

  describe('hostDisconnected', () => {
    it('re-syncs tabindex after reconnect', () => {
      const items = [createItem(), createItem()];
      const ctrl = new RovingFocusController<MockItem>(host, {
        getItems: () => items,
        getFocusTarget: (item) => item.button,
        isDisabled: (item) => item.disabled,
      });

      ctrl.hostUpdated();
      expect(items[0].button.tabIndex).toBe(0);

      ctrl.hostDisconnected();
      // Simulate items changing during disconnect
      items[0].button.tabIndex = -1;
      ctrl.hostUpdated();
      expect(items[0].button.tabIndex).toBe(0);
    });
  });
});
