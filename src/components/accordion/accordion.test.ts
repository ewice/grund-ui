import { describe, it, expect, vi } from 'vitest';
import { fixture } from '@open-wc/testing-helpers/pure';
import { html } from 'lit';
import './index.js';
import type { GrundAccordion } from './accordion';
import { flush } from '../../test-utils/index';

async function createAccordion() {
  const el = await fixture<GrundAccordion>(html`
    <grund-accordion>
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>Item 1</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content 1</grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2">
        <grund-accordion-header>
          <grund-accordion-trigger>Item 2</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content 2</grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-3" disabled>
        <grund-accordion-header>
          <grund-accordion-trigger>Item 3</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content 3</grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `);
  await flush(el);
  return el;
}

function getTriggerButton(accordion: Element, index: number): HTMLButtonElement | null {
  const triggers = accordion.querySelectorAll('grund-accordion-trigger');
  return triggers[index]?.shadowRoot?.querySelector('button') ?? null;
}

describe('grund-accordion', () => {
  describe('rendering', () => {
    it('renders all items', async () => {
      const el = await createAccordion();
      const items = el.querySelectorAll('grund-accordion-item');
      expect(items.length).toBe(3);
    });

    it('renders triggers as buttons', async () => {
      const el = await createAccordion();
      const button = getTriggerButton(el, 0);
      expect(button).toBeTruthy();
      expect(button?.tagName).toBe('BUTTON');
    });

    it('renders header with correct heading level', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion>
          <grund-accordion-item value="item-1">
            <grund-accordion-header level="2">
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);
      const header = el.querySelector('grund-accordion-header');
      const h2 = header?.shadowRoot?.querySelector('h2');
      expect(h2).toBeTruthy();
    });
  });

  describe('expand/collapse', () => {
    it('expands an item when its trigger is clicked', async () => {
      const el = await createAccordion();
      const button = getTriggerButton(el, 0);
      button?.click();
      await flush(el);
      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item?.hasAttribute('expanded')).toBe(true);
    });

    it('collapses the previous item in single mode', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 0)?.click();
      await flush(el);
      getTriggerButton(el, 1)?.click();
      await flush(el);
      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item1?.hasAttribute('expanded')).toBe(false);
      expect(item2?.hasAttribute('expanded')).toBe(true);
    });

    it('does not expand a disabled item', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 2)?.click();
      await flush(el);
      const item = el.querySelector('grund-accordion-item[value="item-3"]') as HTMLElement;
      expect(item?.hasAttribute('expanded')).toBe(false);
    });

    it('keeps the item expanded when non-collapsible trigger is clicked again', async () => {
      const el = await createAccordion(); // default: collapsible=false
      getTriggerButton(el, 0)?.click();
      await flush(el);
      // Click again — should NOT collapse
      getTriggerButton(el, 0)?.click();
      await flush(el);
      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item?.hasAttribute('expanded')).toBe(true);
    });
  });

  describe('multiple mode', () => {
    it('allows multiple items to be expanded', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion type="multiple">
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
          <grund-accordion-item value="item-2">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 2</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 2</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);
      getTriggerButton(el, 0)?.click();
      await flush(el);
      getTriggerButton(el, 1)?.click();
      await flush(el);
      const items = el.querySelectorAll('grund-accordion-item');
      expect(items[0]?.hasAttribute('expanded')).toBe(true);
      expect(items[1]?.hasAttribute('expanded')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('sets aria-expanded on trigger button', async () => {
      const el = await createAccordion();
      const button = getTriggerButton(el, 0);
      expect(button?.getAttribute('aria-expanded')).toBe('false');
      button?.click();
      await flush(el);
      expect(button?.getAttribute('aria-expanded')).toBe('true');
    });

    it('links trigger and panel with aria-controls/aria-labelledby', async () => {
      const el = await createAccordion();
      const button = getTriggerButton(el, 0);
      const panel = el.querySelector('grund-accordion-panel');
      const panelDiv = panel?.shadowRoot?.querySelector('[role="region"]');
      const panelId = button?.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(panelDiv?.id).toBe(panelId);
      expect(panelDiv?.getAttribute('aria-labelledby')).toBe(button?.id);
    });

    it('sets role="region" on panel', async () => {
      const el = await createAccordion();
      const panel = el.querySelector('grund-accordion-panel');
      const region = panel?.shadowRoot?.querySelector('[role="region"]');
      expect(region).toBeTruthy();
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus to next trigger on ArrowDown', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button0?.focus();
      button0?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await flush(el);
      // Focus goes into a shadow root; check both document.activeElement and its shadow
      const focused = document.activeElement;
      const shadowFocused = focused?.shadowRoot?.activeElement ?? focused;
      expect(shadowFocused === button1 || focused === button1).toBe(true);
    });

    it('moves focus to previous trigger on ArrowUp', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button1?.focus();
      button1?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await flush(el);
      const focused = document.activeElement;
      const shadowFocused = focused?.shadowRoot?.activeElement ?? focused;
      expect(shadowFocused === button0 || focused === button0).toBe(true);
    });

    it('moves focus to first trigger on Home', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button1?.focus();
      button1?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await flush(el);
      const focused = document.activeElement;
      const shadowFocused = focused?.shadowRoot?.activeElement ?? focused;
      expect(shadowFocused === button0 || focused === button0).toBe(true);
    });

    it('moves focus to last enabled trigger on End', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      // item-3 is disabled, so last enabled trigger is item-2 (index 1)
      const button1 = getTriggerButton(el, 1);
      button0?.focus();
      button0?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await flush(el);
      const focused = document.activeElement;
      const shadowFocused = focused?.shadowRoot?.activeElement ?? focused;
      expect(shadowFocused === button1 || focused === button1).toBe(true);
    });
  });

  describe('events', () => {
    it('dispatches grund-accordion-change event', async () => {
      const el = await createAccordion();
      const handler = vi.fn();
      el.addEventListener('grund-accordion-change', handler);
      getTriggerButton(el, 0)?.click();
      await flush(el);
      expect(handler).toHaveBeenCalledOnce();
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.value).toBe('item-1');
      expect(detail.expanded).toBe(true);
    });

    it('dispatches grund-accordion-change with expanded=false when collapsing', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion collapsible>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);

      const handler = vi.fn();
      el.addEventListener('grund-accordion-change', handler);

      // First click to expand
      getTriggerButton(el, 0)?.click();
      await flush(el);
      // Second click to collapse
      getTriggerButton(el, 0)?.click();
      await flush(el);

      expect(handler).toHaveBeenCalledTimes(2);
      const secondDetail = handler.mock.calls[1][0].detail;
      expect(secondDetail.expanded).toBe(false);
    });

    it('does not dispatch event when a disabled item trigger is clicked', async () => {
      const el = await createAccordion();
      const handler = vi.fn();
      el.addEventListener('grund-accordion-change', handler);
      getTriggerButton(el, 2)?.click();
      await flush(el);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('dynamic properties', () => {
    it('switches from single to multiple mode at runtime', async () => {
      const el = await createAccordion();
      // Open first item in single mode
      getTriggerButton(el, 0)?.click();
      await flush(el);
      // Switch to multiple mode
      el.type = 'multiple';
      await flush(el);
      // Now both items can be open
      getTriggerButton(el, 1)?.click();
      await flush(el);
      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item1?.hasAttribute('expanded')).toBe(true);
      expect(item2?.hasAttribute('expanded')).toBe(true);
    });

    it('enables collapsing when collapsible changes to true at runtime', async () => {
      const el = await createAccordion(); // collapsible=false by default
      getTriggerButton(el, 0)?.click();
      await flush(el);
      // Enable collapsible at runtime
      el.collapsible = true;
      await flush(el);
      // Should now be collapsible
      getTriggerButton(el, 0)?.click();
      await flush(el);
      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item?.hasAttribute('expanded')).toBe(false);
    });
  });

  describe('initial value', () => {
    it('expands the item matching the value attribute on first render', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion value="item-2">
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
          <grund-accordion-item value="item-2">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 2</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 2</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item2?.hasAttribute('expanded')).toBe(true);
    });

    it('expands multiple items when value is an array in multiple mode', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion type="multiple" .value=${['item-1', 'item-2']}>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
          <grund-accordion-item value="item-2">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 2</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 2</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);
      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item1?.hasAttribute('expanded')).toBe(true);
      expect(item2?.hasAttribute('expanded')).toBe(true);
    });
  });
});
