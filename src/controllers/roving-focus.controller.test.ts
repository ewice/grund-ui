import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { LitElement } from 'lit';
import { simulateKeyboard } from '../test-utils/test-utils';
import { RovingFocusController } from './roving-focus.controller';

class TestHost extends LitElement {
  controller!: RovingFocusController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () => Array.from(this.querySelectorAll('button')),
    });
  }

  override render() {
    return html`<slot></slot>`;
  }
}
if (!customElements.get('test-roving-host')) {
  customElements.define('test-roving-host', TestHost);
}

describe('RovingFocusController', () => {
  async function setup(opts?: {
    orientation?: 'vertical' | 'horizontal';
    loop?: boolean;
    disabledIndex?: number;
  }) {
    const el = await fixture<TestHost>(html`
      <test-roving-host>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </test-roving-host>
    `);
    if (opts?.orientation || opts?.loop !== undefined) {
      el.controller.update({ orientation: opts.orientation, loop: opts.loop });
    }
    if (opts?.disabledIndex !== undefined) {
      const btns = el.querySelectorAll('button');
      btns[opts.disabledIndex].dataset.disabled = '';
    }
    const buttons = Array.from(el.querySelectorAll('button'));
    return { el, buttons };
  }

  it('sets first item to tabIndex=0, rest to -1', async () => {
    const { buttons } = await setup();
    expect(buttons[0].tabIndex).to.equal(0);
    expect(buttons[1].tabIndex).to.equal(-1);
    expect(buttons[2].tabIndex).to.equal(-1);
  });

  it('ArrowDown moves focus to next item (vertical)', async () => {
    const { el, buttons } = await setup();
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[1]);
    expect(buttons[1].tabIndex).to.equal(0);
    expect(buttons[0].tabIndex).to.equal(-1);
  });

  it('ArrowUp moves focus to previous item (vertical)', async () => {
    const { el, buttons } = await setup();
    buttons[1].focus();
    el.controller.update({});
    simulateKeyboard(el, 'ArrowUp');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('Home moves focus to first item', async () => {
    const { el, buttons } = await setup();
    buttons[2].focus();
    simulateKeyboard(el, 'Home');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('End moves focus to last item', async () => {
    const { el, buttons } = await setup();
    buttons[0].focus();
    simulateKeyboard(el, 'End');
    expect(document.activeElement).to.equal(buttons[2]);
  });

  it('loops from last to first when loop=true', async () => {
    const { el, buttons } = await setup({ loop: true });
    buttons[2].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('does not loop when loop=false', async () => {
    const { el, buttons } = await setup({ loop: false });
    buttons[2].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[2]);
  });

  it('skips disabled items', async () => {
    const { el, buttons } = await setup({ disabledIndex: 1 });
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[2]);
  });

  it('uses ArrowLeft/ArrowRight for horizontal orientation', async () => {
    const { el, buttons } = await setup({ orientation: 'horizontal' });
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowRight');
    expect(document.activeElement).to.equal(buttons[1]);
  });

  it('ignores ArrowDown/ArrowUp in horizontal orientation', async () => {
    const { el, buttons } = await setup({ orientation: 'horizontal' });
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('reverses ArrowLeft/ArrowRight in RTL for horizontal orientation', async () => {
    const wrapper = document.createElement('div');
    wrapper.dir = 'rtl';
    document.body.appendChild(wrapper);
    const { el, buttons } = await setup({ orientation: 'horizontal' });
    wrapper.appendChild(el);
    buttons[0].focus();
    // In RTL, ArrowLeft = next (visually right-to-left, so "left" moves forward)
    simulateKeyboard(el, 'ArrowLeft');
    expect(document.activeElement).to.equal(buttons[1]);
    wrapper.remove();
  });
});
