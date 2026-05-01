import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils';

import '../collapsible';
import '../collapsible-trigger';

import type { GrundCollapsible } from '../collapsible';

describe('GrundCollapsibleTrigger', () => {
  async function setup(
    template = html`
      <grund-collapsible>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `,
  ) {
    const el = await fixture<GrundCollapsible>(template);
    await flush(el);
    return el;
  }

  it('renders native button with part="trigger" and type="button"', async () => {
    const el = await setup();
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    expect(button.tagName).to.equal('BUTTON');
    expect(button.type).to.equal('button');
    expect(trigger.hasAttribute('data-open')).to.be.false;
    expect(trigger.hasAttribute('data-disabled')).to.be.false;
    const slot = button.querySelector('slot')!;
    expect(slot.assignedNodes()[0].textContent).to.equal('Toggle');
  });

  it('reflects data-open on trigger host when open', async () => {
    const el = await setup(html`
      <grund-collapsible default-open>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    expect(trigger.hasAttribute('data-open')).to.be.true;
  });

  it('reflects data-disabled on trigger host when disabled', async () => {
    const el = await setup(html`
      <grund-collapsible disabled>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    expect(trigger.hasAttribute('data-disabled')).to.be.true;
  });

  it('sets aria-expanded matching open state', async () => {
    const el = await setup();
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    expect(button.getAttribute('aria-expanded')).to.equal('false');

    button.click();
    await flush(el);

    expect(button.getAttribute('aria-expanded')).to.equal('true');
  });

  it('sets aria-disabled when root is disabled', async () => {
    const el = await setup(html`
      <grund-collapsible disabled>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    expect(button.getAttribute('aria-disabled')).to.equal('true');
  });

  it('omits aria-disabled when root is not disabled', async () => {
    const el = await setup();
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    expect(button.hasAttribute('aria-disabled')).to.be.false;
  });

  it('click does nothing when disabled', async () => {
    const el = await setup(html`
      <grund-collapsible disabled>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    button.click();
    await flush(el);
    expect(el.hasAttribute('data-open')).to.be.false;
  });
});
