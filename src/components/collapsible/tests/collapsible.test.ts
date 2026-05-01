import { fixture, html, expect } from '@open-wc/testing';
import { LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/test-utils';

import '../collapsible';
import '../collapsible-trigger';
import { collapsibleRootContext } from '../collapsible.context';

import type { GrundCollapsible } from '../collapsible';
import type { CollapsibleRootContext } from '../collapsible.context';
import type { CollapsibleOpenChangeDetail } from '../types';

class TestCollapsibleConsumer extends LitElement {
  @consume({ context: collapsibleRootContext, subscribe: true })
  @state()
  private rootCtx?: CollapsibleRootContext;

  private handleClick = (): void => {
    this.rootCtx?.requestToggle('trigger-press');
  };

  override render() {
    return html`<button type="button" @click=${this.handleClick}>Toggle</button>`;
  }
}

if (!customElements.get('test-collapsible-consumer')) {
  customElements.define('test-collapsible-consumer', TestCollapsibleConsumer);
}

describe('GrundCollapsible', () => {
  async function setup(
    template = html`
      <grund-collapsible>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>Content</grund-collapsible-panel>
      </grund-collapsible>
    `,
  ) {
    const el = await fixture<GrundCollapsible>(template);
    await flush(el);
    return el;
  }

  it('renders with default properties', async () => {
    const el = await setup();
    expect(el.disabled).to.be.false;
    expect(el.defaultOpen).to.be.false;
    expect(el.open).to.be.undefined;
  });

  it('reflects data-open when defaultOpen is true', async () => {
    const el = await setup(html`
      <grund-collapsible default-open>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>Content</grund-collapsible-panel>
      </grund-collapsible>
    `);
    expect(el.hasAttribute('data-open')).to.be.true;
  });

  it('reflects data-disabled when disabled', async () => {
    const el = await setup(html`
      <grund-collapsible disabled>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  describe('uncontrolled mode', () => {
    it('mutates state and emits grund-open-change on trigger click', async () => {
      const events: CollapsibleOpenChangeDetail[] = [];
      const el = await setup(html`
        <grund-collapsible
          @grund-open-change=${(e: CustomEvent<CollapsibleOpenChangeDetail>) =>
            events.push(e.detail)}
        >
          <test-collapsible-consumer></test-collapsible-consumer>
        </grund-collapsible>
      `);

      const consumer = el.querySelector('test-collapsible-consumer')!;
      consumer.shadowRoot!.querySelector('button')!.click();
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.true;
      expect(events).to.have.length(1);
      expect(events[0].open).to.be.true;
      expect(events[0].reason).to.equal('trigger-press');
      expect(events[0].trigger).to.be.null;
    });

    it('emits grund-open-change with the registered trigger element', async () => {
      const events: CollapsibleOpenChangeDetail[] = [];
      const el = await setup(html`
        <grund-collapsible
          @grund-open-change=${(e: CustomEvent<CollapsibleOpenChangeDetail>) =>
            events.push(e.detail)}
        >
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
        </grund-collapsible>
      `);

      const trigger = el.querySelector('grund-collapsible-trigger')!;
      trigger.shadowRoot!.querySelector('button')!.click();
      await flush(el);

      expect(events).to.have.length(1);
      expect(events[0].trigger).to.equal(trigger);
    });
  });

  describe('controlled mode', () => {
    it('emits grund-open-change without mutating internal state', async () => {
      const events: CollapsibleOpenChangeDetail[] = [];
      const el = await setup(html`
        <grund-collapsible
          .open=${false}
          @grund-open-change=${(e: CustomEvent<CollapsibleOpenChangeDetail>) =>
            events.push(e.detail)}
        >
          <test-collapsible-consumer></test-collapsible-consumer>
        </grund-collapsible>
      `);

      const consumer = el.querySelector('test-collapsible-consumer')!;
      consumer.shadowRoot!.querySelector('button')!.click();
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.false;
      expect(events).to.have.length(1);
      expect(events[0].open).to.be.true;
    });

    it('opens when controlled open property is set to true', async () => {
      const el = await setup(html`
        <grund-collapsible .open=${false}>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);

      expect(el.hasAttribute('data-open')).to.be.false;

      el.open = true;
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.true;
    });
  });

  describe('disabled', () => {
    it('does not toggle when disabled', async () => {
      const events: CollapsibleOpenChangeDetail[] = [];
      const el = await setup(html`
        <grund-collapsible
          disabled
          @grund-open-change=${(e: CustomEvent<CollapsibleOpenChangeDetail>) =>
            events.push(e.detail)}
        >
          <test-collapsible-consumer></test-collapsible-consumer>
        </grund-collapsible>
      `);

      const consumer = el.querySelector('test-collapsible-consumer')!;
      consumer.shadowRoot!.querySelector('button')!.click();
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.false;
      expect(events).to.have.length(0);
    });
  });
});
