import { fixture, fixtureCleanup, html } from '@open-wc/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { resolveReferencedElements } from './resolve-referenced-elements';

describe('resolveReferencedElements', () => {
  afterEach(() => fixtureCleanup());

  it('returns [] for empty or whitespace-only input', async () => {
    const root = await fixture<HTMLDivElement>(html`<div></div>`);
    expect(resolveReferencedElements('', root)).to.deep.equal([]);
    expect(resolveReferencedElements('   ', root)).to.deep.equal([]);
  });

  it('splits on whitespace and filters blanks', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div>
        <span id="a">A</span>
        <span id="b">B</span>
      </div>
    `);
    const result = resolveReferencedElements('a   b', root);
    expect(result.map((el) => el.id)).to.deep.equal(['a', 'b']);
  });

  it('ignores IDs that do not resolve', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div><span id="a">A</span></div>
    `);
    const result = resolveReferencedElements('a missing b', root);
    expect(result.map((el) => el.id)).to.deep.equal(['a']);
  });

  it('resolves IDs in the host element\'s root node (shadow root)', async () => {
    class TestHostElement extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
          <span id="shadow-label">Shadow Label</span>
          <div id="probe"></div>
        `;
      }
    }
    if (!customElements.get('test-host-element')) {
      customElements.define('test-host-element', TestHostElement);
    }

    const host = await fixture<HTMLElement>(html`<test-host-element></test-host-element>`);
    const probe = host.shadowRoot!.getElementById('probe')!;

    const result = resolveReferencedElements('shadow-label', probe);

    expect(result).to.have.length(1);
    expect(result[0].id).to.equal('shadow-label');
  });

  it('falls back to the document when getRootNode is the document', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div><span id="doc-label">Doc</span></div>
    `);
    const result = resolveReferencedElements('doc-label', root);
    expect(result.map((el) => el.id)).to.deep.equal(['doc-label']);
  });
});
