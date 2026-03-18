import { describe, it, expect, vi } from 'vitest';
import { fixture } from '@open-wc/testing-helpers/pure';
import { ContextConsumer } from '@lit/context';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../index.js';
import type { GrundAccordion } from '../accordion';
import type { GrundAccordionPanel } from '../accordion-panel';
import { accordionContext, type AccordionContextValue } from '../context';
import { flush } from '../../../test-utils/index';

@customElement('test-accordion-root-actions')
class TestAccordionRootActions extends LitElement {
  private accordionCtx?: AccordionContextValue;

  // @ts-expect-error -- ContextConsumer is registered for side effects; TS cannot see that read
  private accordionConsumer = new ContextConsumer(this, {
    context: accordionContext,
    callback: (ctx) => {
      this.accordionCtx = ctx;
      this.requestUpdate();
    },
    subscribe: true,
  });

  public override render() {
    return html`
      <button id="toggle" @click=${() => this.accordionCtx?.toggle('item-1')}>toggle</button>
      <button id="open" @click=${() => this.accordionCtx?.openItem('item-2')}>open</button>
    `;
  }
}

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

function getPanelInner(panel: Element | null): HTMLDivElement | null {
  return panel?.shadowRoot?.querySelector('[part="panel"]') ?? null;
}

function getItem(accordion: Element, value: string): HTMLElement {
  return accordion.querySelector(`grund-accordion-item[value="${value}"]`) as HTMLElement;
}

describe('grund-accordion', () => {
  describe('rendering', () => {
    it('renders all items', async () => {
      const el = await createAccordion();
      expect(el.querySelectorAll('grund-accordion-item').length).toBe(3);
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
      const h2 = header?.shadowRoot
        ?.querySelector('grund-heading')
        ?.shadowRoot?.querySelector('h2');
      expect(h2).toBeTruthy();
    });
  });

  describe('expand/collapse', () => {
    it('expands an item when its trigger is clicked', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 0)?.click();
      await flush(el);

      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item.hasAttribute('expanded')).toBe(true);
    });

    it('collapses the previous item in single mode', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 0)?.click();
      await flush(el);
      getTriggerButton(el, 1)?.click();
      await flush(el);

      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item1.hasAttribute('expanded')).toBe(false);
      expect(item2.hasAttribute('expanded')).toBe(true);
    });

    it('does not expand a disabled item', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 2)?.click();
      await flush(el);

      const item = el.querySelector('grund-accordion-item[value="item-3"]') as HTMLElement;
      expect(item.hasAttribute('expanded')).toBe(false);
    });

    it('collapses the item when its trigger is clicked again', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 0)?.click();
      await flush(el);
      getTriggerButton(el, 0)?.click();
      await flush(el);

      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item.hasAttribute('expanded')).toBe(false);
    });
  });

  describe('multiple mode', () => {
    it('allows multiple items to be expanded', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion multiple>
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

    it('links trigger and panel via ARIA attributes when the panel is mounted', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion keep-mounted>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);

      const button = getTriggerButton(el, 0);
      const panel = el.querySelector('grund-accordion-panel');
      const panelDiv = getPanelInner(panel);

      expect(button?.hasAttribute('aria-controls')).toBe(true);
      expect(panelDiv?.hasAttribute('aria-labelledby')).toBe(true);
    });

    it('relinks trigger and panel after the panel is reattached', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion keep-mounted>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);

      const panel = el.querySelector('grund-accordion-panel') as GrundAccordionPanel;
      panel.remove();
      await flush(el);

      const replacement = document.createElement('grund-accordion-panel');
      replacement.textContent = 'Content 1';
      el.querySelector('grund-accordion-item')?.append(replacement);
      await flush(el);

      expect(getPanelInner(replacement)?.hasAttribute('aria-labelledby')).toBe(true);
      expect(getTriggerButton(el, 0)?.hasAttribute('aria-controls')).toBe(true);
    });

    it('sets role="region" on an open panel', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 0)?.click();
      await flush(el);

      const panel = el.querySelector('grund-accordion-panel');
      const region = panel?.shadowRoot?.querySelector('[role="region"]');
      expect(region).toBeTruthy();
    });
  });

  describe('integration registry behavior', () => {
    it('updates derived item order when mounted items are reordered', async () => {
      const el = await createAccordion();
      const first = getItem(el, 'item-1');
      const second = getItem(el, 'item-2');

      el.insertBefore(second, first);
      await flush(el);

      expect(second.dataset.index).toBe('0');
      expect(first.dataset.index).toBe('1');
    });

    it('keeps descendant root actions working through the preserved context aliases', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion>
          <test-accordion-root-actions></test-accordion-root-actions>
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

      const actions = el.querySelector('test-accordion-root-actions')!;
      const toggle = actions.shadowRoot?.querySelector<HTMLButtonElement>('#toggle');
      const open = actions.shadowRoot?.querySelector<HTMLButtonElement>('#open');

      toggle?.click();
      await flush(el);

      expect(getItem(el, 'item-1').hasAttribute('expanded')).toBe(true);
      expect(getItem(el, 'item-2').hasAttribute('expanded')).toBe(false);

      open?.click();
      await flush(el);

      expect(getItem(el, 'item-1').hasAttribute('expanded')).toBe(false);
      expect(getItem(el, 'item-2').hasAttribute('expanded')).toBe(true);
    });

    it('registers trigger and panel children that mount after the item', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion keep-mounted>
          <grund-accordion-item value="item-1"></grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);

      const item = el.querySelector('grund-accordion-item')!;
      const header = document.createElement('grund-accordion-header');
      const trigger = document.createElement('grund-accordion-trigger');
      trigger.textContent = 'Item 1';
      header.append(trigger);
      item.append(header);
      await flush(el);

      const panel = document.createElement('grund-accordion-panel');
      panel.textContent = 'Content 1';
      item.append(panel);
      await flush(el);

      const button = trigger.shadowRoot?.querySelector('button');
      const panelDiv = getPanelInner(panel);

      expect(button?.getAttribute('aria-expanded')).toBe('false');
      expect(button?.hasAttribute('aria-controls')).toBe(true);
      expect(panelDiv?.hasAttribute('aria-labelledby')).toBe(true);
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus to next trigger on ArrowDown', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button0?.focus();
      button0?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
      );
      await flush(el);

      const focused = document.activeElement;
      const shadowFocused = focused?.shadowRoot?.activeElement ?? focused;
      expect(shadowFocused === button1 || focused === button1).toBe(true);
    });

    it('moves focus to previous trigger on ArrowUp', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button1?.focus();
      button1?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }),
      );
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
      button1?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true, composed: true }),
      );
      await flush(el);

      const focused = document.activeElement;
      const shadowFocused = focused?.shadowRoot?.activeElement ?? focused;
      expect(shadowFocused === button0 || focused === button0).toBe(true);
    });

    it('moves focus to last enabled trigger on End', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button0?.focus();
      button0?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true, composed: true }),
      );
      await flush(el);

      const focused = document.activeElement;
      const shadowFocused = focused?.shadowRoot?.activeElement ?? focused;
      expect(shadowFocused === button1 || focused === button1).toBe(true);
    });

    it('sets tabindex="0" on the first enabled trigger and "-1" on the rest', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      const button2 = getTriggerButton(el, 2);
      expect(button0?.tabIndex).toBe(0);
      expect(button1?.tabIndex).toBe(-1);
      expect(button2?.tabIndex).toBe(-1);
    });

    it('sets tabindex="0" on the first non-disabled trigger when the first item is disabled', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion>
          <grund-accordion-item value="item-1" disabled>
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

      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      expect(button0?.tabIndex).toBe(-1);
      expect(button1?.tabIndex).toBe(0);
    });

    it('moves tabindex to the new trigger when navigating with ArrowDown', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button0?.focus();
      button0?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
      );
      await flush(el);

      expect(button0?.tabIndex).toBe(-1);
      expect(button1?.tabIndex).toBe(0);
    });

    it('moves focus away from a trigger when its item becomes disabled', async () => {
      const el = await createAccordion();
      const item0 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);

      expect(button0?.tabIndex).toBe(0);
      expect(button1?.tabIndex).toBe(-1);

      item0.setAttribute('disabled', '');
      await flush(el);

      expect(button0?.tabIndex).toBe(-1);
      expect(button1?.tabIndex).toBe(0);
    });
  });

  describe('events', () => {
    it('dispatches grund-change', async () => {
      const el = await createAccordion();
      const handler = vi.fn();
      el.addEventListener('grund-change', handler);

      getTriggerButton(el, 0)?.click();
      await flush(el);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].detail).toEqual({ value: 'item-1', expanded: true });
    });

    it('dispatches grund-change with expanded=false when collapsing', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion>
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
      el.addEventListener('grund-change', handler);

      getTriggerButton(el, 0)?.click();
      await flush(el);
      getTriggerButton(el, 0)?.click();
      await flush(el);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[1][0].detail).toEqual({ value: 'item-1', expanded: false });
    });

    it('does not dispatch grund-change when a disabled item trigger is clicked', async () => {
      const el = await createAccordion();
      const handler = vi.fn();
      el.addEventListener('grund-change', handler);

      getTriggerButton(el, 2)?.click();
      await flush(el);

      expect(handler).not.toHaveBeenCalled();
    });

    it('dispatches grund-value-change with the next value array', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion multiple>
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

      const handler = vi.fn();
      el.addEventListener('grund-value-change', handler);

      getTriggerButton(el, 0)?.click();
      await flush(el);
      getTriggerButton(el, 1)?.click();
      await flush(el);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[1][0].detail).toEqual({
        value: ['item-1', 'item-2'],
        itemValue: 'item-2',
        open: true,
      });
    });

    it('keeps grund-value-change aligned with the engine result when DOM order changes during grund-change', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion multiple>
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
      getTriggerButton(el, 0)?.click();
      await flush(el);

      const handler = vi.fn(() => {
        el.append(item1);
        el.prepend(item2);
      });

      el.addEventListener('grund-change', handler, { once: true });

      const valueChange = vi.fn();
      el.addEventListener('grund-value-change', valueChange);

      getTriggerButton(el, 1)?.click();
      await flush(el);

      expect(handler).toHaveBeenCalledOnce();
      expect(valueChange).toHaveBeenCalledOnce();
      expect(valueChange.mock.calls[0][0].detail.value).toEqual(['item-1', 'item-2']);
    });

    it('dispatches grund-open-change from the item', async () => {
      const el = await createAccordion();
      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const handler = vi.fn();
      item.addEventListener('grund-open-change', handler);

      getTriggerButton(el, 0)?.click();
      await flush(el);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].detail).toEqual({
        open: true,
        value: 'item-1',
        index: 0,
      });
    });
  });

  describe('dynamic properties', () => {
    it('seeds uncontrolled state from defaultValue only once', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion default-value="item-2">
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

      expect(getItem(el, 'item-1').hasAttribute('expanded')).toBe(false);
      expect(getItem(el, 'item-2').hasAttribute('expanded')).toBe(true);

      el.defaultValue = 'item-1';
      await flush(el);

      expect(getItem(el, 'item-1').hasAttribute('expanded')).toBe(false);
      expect(getItem(el, 'item-2').hasAttribute('expanded')).toBe(true);
    });

    it('switches from single to multiple mode at runtime', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 0)?.click();
      await flush(el);

      el.multiple = true;
      await flush(el);
      getTriggerButton(el, 1)?.click();
      await flush(el);

      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item1.hasAttribute('expanded')).toBe(true);
      expect(item2.hasAttribute('expanded')).toBe(true);
    });

    it('keeps an open item expanded when its value changes', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion multiple>
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

      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      getTriggerButton(el, 0)?.click();
      await flush(el);

      const openHandler = vi.fn();
      item.addEventListener('grund-open-change', openHandler);

      const valueHandler = vi.fn();
      el.addEventListener('grund-value-change', valueHandler);

      item.value = 'item-1-renamed';
      await flush(el);

      expect(item.hasAttribute('expanded')).toBe(true);
      expect(openHandler).not.toHaveBeenCalled();

      getTriggerButton(el, 1)?.click();
      await flush(el);

      expect(valueHandler).toHaveBeenCalledOnce();
      expect(valueHandler.mock.calls[0][0].detail.value).toEqual(['item-1-renamed', 'item-2']);
    });

    it('keeps runtime-renamed items addressable under the new value', async () => {
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
        </grund-accordion>
      `);
      await flush(el);

      const item = getItem(el, 'item-1');
      getTriggerButton(el, 0)?.click();
      await flush(el);

      item.value = 'item-1-renamed';
      await flush(el);

      const handler = vi.fn();
      el.addEventListener('grund-value-change', handler);

      getTriggerButton(el, 0)?.click();
      await flush(el);

      expect((item as unknown as { value: string }).value).toBe('item-1-renamed');
      expect(item.hasAttribute('expanded')).toBe(false);
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].detail).toEqual({
        value: [],
        itemValue: 'item-1-renamed',
        open: false,
      });
    });
  });

  describe('registration', () => {
    it('unregisters an item when it is removed from the DOM', async () => {
      const el = await createAccordion();
      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      getTriggerButton(el, 0)?.click();
      await flush(el);

      expect(item1.hasAttribute('expanded')).toBe(true);

      item1.remove();
      await flush(el);

      const button1 = getTriggerButton(el, 0);
      expect(button1?.tabIndex).toBe(0);
    });

  });

  describe('initial value', () => {
    it('expands the item matching the value attribute on first render', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion default-value="item-2">
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
      expect(item2.hasAttribute('expanded')).toBe(true);
    });

    it('expands multiple items when defaultValue is an array in multiple mode', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion multiple .defaultValue=${['item-1', 'item-2']}>
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
      expect(item1.hasAttribute('expanded')).toBe(true);
      expect(item2.hasAttribute('expanded')).toBe(true);
    });
  });

  describe('controlled mode', () => {
    it('emits events in controlled mode without mutating rendered state', async () => {
      const changeHandler = vi.fn();
      const valueHandler = vi.fn();
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion
          .value=${'item-1'}
          @grund-change=${changeHandler}
          @grund-value-change=${valueHandler}
        >
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

      getTriggerButton(el, 1)?.click();
      await flush(el);

      expect(getItem(el, 'item-1').hasAttribute('expanded')).toBe(true);
      expect(getItem(el, 'item-2').hasAttribute('expanded')).toBe(false);
      expect(changeHandler).toHaveBeenCalledOnce();
      expect(changeHandler.mock.calls[0][0].detail).toEqual({ value: 'item-2', expanded: true });
      expect(valueHandler).toHaveBeenCalledOnce();
      expect(valueHandler.mock.calls[0][0].detail).toEqual({
        value: ['item-2'],
        itemValue: 'item-2',
        open: true,
      });
    });

    it('does not update internal state when value is set', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion .value=${'item-1'}>
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
      expect(item1.hasAttribute('expanded')).toBe(true);

      getTriggerButton(el, 1)?.click();
      await flush(el);

      expect(item1.hasAttribute('expanded')).toBe(true);
    });

    it('fires grund-change with the requested state in controlled mode', async () => {
      const handler = vi.fn();
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion .value=${'item-1'} @grund-change=${handler}>
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

      getTriggerButton(el, 1)?.click();
      await flush(el);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].detail).toEqual({ value: 'item-2', expanded: true });
    });
  });

  describe('base ui compatibility', () => {
    it('supports horizontal roving focus through the orientation prop', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion orientation="horizontal">
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

      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button0?.focus();
      button0?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }),
      );
      await flush(el);

      const focused = document.activeElement;
      const shadowFocused = focused?.shadowRoot?.activeElement ?? focused;
      expect(shadowFocused === button1 || focused === button1).toBe(true);
    });

    it('does not wrap focus when loopFocus is false', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion .loopFocus=${false}>
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

      const button1 = getTriggerButton(el, 1);
      button1?.focus();
      button1?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
      );
      await flush(el);

      expect(button1?.tabIndex).toBe(0);
    });

    it('unmounts closed panels by default and remounts them when opened', async () => {
      const el = await createAccordion();
      const panel = el.querySelector('grund-accordion-panel');
      expect(getPanelInner(panel)).toBeNull();

      getTriggerButton(el, 0)?.click();
      await flush(el);

      expect(getPanelInner(panel)).toBeTruthy();
    });

    it('keeps closed panels mounted when keep-mounted is set on the root', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion keep-mounted>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);

      const panel = el.querySelector('grund-accordion-panel');
      expect(panel?.getAttribute('data-state')).toBe('closed');
      expect(getPanelInner(panel)).toBeTruthy();
    });

    it('uses hidden="until-found" when hidden-until-found is enabled', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion hidden-until-found>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Searchable content</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);

      const panel = el.querySelector('grund-accordion-panel');
      expect(getPanelInner(panel)?.getAttribute('hidden')).toBe('until-found');
    });

    it('opens an item when beforematch fires for a hidden-until-found panel', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion hidden-until-found>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Searchable content</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);

      const panel = el.querySelector('grund-accordion-panel') as GrundAccordionPanel;
      getPanelInner(panel)?.dispatchEvent(new Event('beforematch'));
      await flush(el);

      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item.hasAttribute('expanded')).toBe(true);
    });

    it('does not open a disabled root accordion when beforematch fires', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion hidden-until-found disabled>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Searchable content</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);

      const panel = el.querySelector('grund-accordion-panel') as GrundAccordionPanel;
      getPanelInner(panel)?.dispatchEvent(new Event('beforematch'));
      await flush(el);

      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item.hasAttribute('expanded')).toBe(false);
    });

    it('applies Base UI-style data attributes across the parts', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 0)?.click();
      await flush(el);

      const item = el.querySelector('grund-accordion-item[value="item-1"]');
      const header = el.querySelector('grund-accordion-header');
      const trigger = el.querySelector('grund-accordion-trigger');
      const panel = el.querySelector('grund-accordion-panel');

      expect(el.getAttribute('data-orientation')).toBe('vertical');
      expect(item?.hasAttribute('data-open')).toBe(true);
      expect(item?.getAttribute('data-index')).toBe('0');
      expect(header?.shadowRoot?.querySelector('grund-heading')).toBeTruthy();
      expect(trigger?.hasAttribute('data-panel-open')).toBe(true);
      expect(panel?.hasAttribute('data-open')).toBe(true);
      expect(panel?.getAttribute('data-orientation')).toBe('vertical');
      expect(panel?.getAttribute('data-index')).toBe('0');
    });
  });
});
