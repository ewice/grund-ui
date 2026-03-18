import { describe, it, expect } from 'vitest';
import { fixture } from '@open-wc/testing-helpers/pure';
import { html } from 'lit';
import './heading.js';
import type { GrundHeading } from './heading';

describe('grund-heading', () => {
  it('renders h3 by default', async () => {
    const el = await fixture<GrundHeading>(html`<grund-heading>Title</grund-heading>`);
    const heading = el.shadowRoot?.querySelector('h3');
    expect(heading).toBeTruthy();
    expect(heading?.getAttribute('part')).toBe('heading');
  });

  it('renders the correct heading level', async () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const el = await fixture<GrundHeading>(
        html`<grund-heading .level=${level}>Title</grund-heading>`,
      );
      const tag = `h${level}`;
      const heading = el.shadowRoot?.querySelector(tag);
      expect(heading).toBeTruthy();
      expect(heading?.getAttribute('part')).toBe('heading');
    }
  });

  it('slots content into the heading', async () => {
    const el = await fixture<GrundHeading>(html`<grund-heading>Slotted Content</grund-heading>`);
    const slot = el.shadowRoot?.querySelector('slot');
    expect(slot).toBeTruthy();
  });

  it('has no visual styles (headless)', async () => {
    const el = await fixture<GrundHeading>(html`<grund-heading>Title</grund-heading>`);
    expect(el.shadowRoot?.adoptedStyleSheets.length).toBe(0);
  });
});
