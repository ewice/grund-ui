import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { LitElement } from 'lit';
import { flush, simulateKeyboard, getByPart } from './index.js';

class TestElement extends LitElement {
  override render() {
    return html`<button part="btn">click</button>`;
  }
}
if (!customElements.get('test-flush-element')) {
  customElements.define('test-flush-element', TestElement);
}

describe('test-utils', () => {
  it('flush resolves without error', async () => {
    const el = await fixture(html`<test-flush-element></test-flush-element>`);
    await flush(el);
  });

  it('getByPart finds a part in shadow DOM', async () => {
    const el = await fixture(html`<test-flush-element></test-flush-element>`);
    const btn = getByPart(el, 'btn');
    expect(btn.textContent).to.equal('click');
  });

  it('getByPart throws when part is missing', async () => {
    const el = await fixture(html`<test-flush-element></test-flush-element>`);
    expect(() => getByPart(el, 'nonexistent')).to.throw();
  });

  it('simulateKeyboard dispatches a keydown event', async () => {
    const el = await fixture(html`<div></div>`);
    let received = '';
    el.addEventListener('keydown', (e: Event) => {
      received = (e as KeyboardEvent).key;
    });
    simulateKeyboard(el, 'ArrowDown');
    expect(received).to.equal('ArrowDown');
  });
});
