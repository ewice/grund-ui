import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/test-utils';

import '../collapsible';
import '../collapsible-trigger';
import '../collapsible-panel';

import type { GrundCollapsible } from '../collapsible';

describe('GrundCollapsiblePanel', () => {
  async function setup(
    template = html`
      <grund-collapsible default-open>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>Content</grund-collapsible-panel>
      </grund-collapsible>
    `,
  ) {
    const el = await fixture<GrundCollapsible>(template);
    await flush(el);
    return el;
  }

  describe('visibility', () => {
    it('renders panel content when open', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv).to.exist;
      expect(panelDiv?.hasAttribute('hidden')).to.be.false;
    });

    it('removes panel from DOM when closed (default)', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      // Wait for presence exit to complete
      await aTimeout(0);
      await el.updateComplete;
      await flush(el);
      expect(panel.shadowRoot?.querySelector('[part="panel"]')).to.be.null;
    });

    it('keeps panel in DOM with hidden when keepMounted', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel keep-mounted>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv).to.exist;
      expect(panelDiv?.hasAttribute('hidden')).to.be.true;
    });

    it('uses hidden="until-found" when hiddenUntilFound', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel hidden-until-found>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv).to.exist;
      expect(panelDiv?.getAttribute('hidden')).to.equal('until-found');
    });

    it('hiddenUntilFound takes precedence over keepMounted', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel keep-mounted hidden-until-found>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv?.getAttribute('hidden')).to.equal('until-found');
    });
  });

  describe('beforematch', () => {
    it('requests open on beforematch event', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel hidden-until-found>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot!.querySelector('[part="panel"]')!;

      panelDiv.dispatchEvent(new Event('beforematch', { bubbles: true }));
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.true;
    });
  });

  describe('accessibility', () => {
    it('panel div has role="region"', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv?.getAttribute('role')).to.equal('region');
    });

    it('ariaLabelledByElements links to trigger host', async () => {
      const el = await setup();
      const trigger = el.querySelector('grund-collapsible-trigger')!;
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]') as HTMLElement;
      expect(panelDiv.ariaLabelledByElements).to.include(trigger);
    });

    it('trigger ariaControlsElements links to panel host', async () => {
      const el = await setup();
      const trigger = el.querySelector('grund-collapsible-trigger')!;
      const panel = el.querySelector('grund-collapsible-panel')!;
      const button = trigger.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
      expect(button.ariaControlsElements).to.include(panel);
    });
  });

  describe('data attributes', () => {
    it('reflects data-open on panel host when open', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      expect(panel.hasAttribute('data-open')).to.be.true;
    });

    it('reflects data-disabled on panel host when disabled', async () => {
      const el = await setup(html`
        <grund-collapsible disabled default-open>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      expect(panel.hasAttribute('data-disabled')).to.be.true;
    });
  });

  describe('CSS custom properties', () => {
    it('sets --grund-collapsible-panel-height when open', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      const height = getComputedStyle(panel).getPropertyValue('--grund-collapsible-panel-height');
      expect(height).to.not.equal('');
    });

    it('sets --grund-collapsible-panel-width when open', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      const width = getComputedStyle(panel).getPropertyValue('--grund-collapsible-panel-width');
      expect(width).to.not.equal('');
    });
  });
});
