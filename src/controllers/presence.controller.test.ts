import { fixture, html, aTimeout } from '@open-wc/testing';
import { describe, expect, it, vi } from 'vitest';
import { LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';
import { PresenceController } from './presence.controller';

import type { PresenceStatus } from './presence.controller';

class TestPresenceHost extends LitElement {
  static override styles = css`
    :host { display: block; }
    #target { transition: opacity 50ms; }
    #target.hidden { opacity: 0; }
  `;

  @property({ type: Boolean }) show = false;

  presence = new PresenceController(this, {
    isPresent: () => this.show,
    getTransitionElement: () => this.shadowRoot?.getElementById('target') ?? null,
  });

  override render() {
    return html`<div id="target" class="${this.show ? '' : 'hidden'}">content</div>`;
  }
}

if (!customElements.get('test-presence-host')) {
  customElements.define('test-presence-host', TestPresenceHost);
}

class TestPresenceNoTransition extends LitElement {
  @property({ type: Boolean }) show = false;

  presence = new PresenceController(this, {
    isPresent: () => this.show,
  });

  override render() {
    return html`<div>content</div>`;
  }
}

if (!customElements.get('test-presence-no-transition')) {
  customElements.define('test-presence-no-transition', TestPresenceNoTransition);
}

class TestPresenceAnimationHost extends LitElement {
  static override styles = css`
    @keyframes fade { from { opacity: 1; } to { opacity: 0; } }
    :host { display: block; }
    #target.hidden { animation: fade 50ms; }
  `;

  @property({ type: Boolean }) show = false;

  presence = new PresenceController(this, {
    isPresent: () => this.show,
    getTransitionElement: () => this.shadowRoot?.getElementById('target') ?? null,
  });

  override render() {
    return html`<div id="target" class="${this.show ? '' : 'hidden'}">content</div>`;
  }
}

if (!customElements.get('test-presence-animation-host')) {
  customElements.define('test-presence-animation-host', TestPresenceAnimationHost);
}

describe('PresenceController', () => {
  describe('entering', () => {
    it('present becomes true immediately when isPresent returns true', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host></test-presence-host>`,
      );
      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');

      el.show = true;
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('starting');
    });

    it('status transitions from starting to idle after a microtask', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host></test-presence-host>`,
      );
      el.show = true;
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(el.presence.status).to.equal('idle');
    });
  });

  describe('exiting without transition', () => {
    it('completes exit after a microtask when no transition is active', async () => {
      const el = await fixture<TestPresenceNoTransition>(
        html`<test-presence-no-transition .show=${true}></test-presence-no-transition>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('idle');

      el.show = false;
      await el.updateComplete;

      expect(el.presence.status).to.equal('ending');

      await aTimeout(0);
      await el.updateComplete;

      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');
    });
  });

  describe('exiting with transition', () => {
    it('stays present during ending until transitionend fires', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host .show=${true}></test-presence-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('ending');

      // Fire transitionend on the target element
      const target = el.shadowRoot!.getElementById('target')!;
      target.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }));
      await el.updateComplete;

      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');
    });

    it('stays present during ending until animationend fires', async () => {
      const el = await fixture<TestPresenceAnimationHost>(
        html`<test-presence-animation-host .show=${true}></test-presence-animation-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;

      const target = el.shadowRoot!.getElementById('target')!;
      target.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'fade' }));
      await el.updateComplete;

      expect(el.presence.present).to.be.false;
    });
  });

  describe('cancel exit on reopen', () => {
    it('cancels pending exit when reopened', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host .show=${true}></test-presence-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      // Start exit
      el.show = false;
      await el.updateComplete;
      expect(el.presence.status).to.equal('ending');

      // Reopen before exit completes
      el.show = true;
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('starting');
    });

    it('does not complete a no-transition exit after reopening before the microtask', async () => {
      const el = await fixture<TestPresenceNoTransition>(
        html`<test-presence-no-transition .show=${true}></test-presence-no-transition>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;
      expect(el.presence.status).to.equal('ending');

      el.show = true;
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('idle');
    });
  });

  describe('fallback completion', () => {
    it('completes exit if transition events never fire', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host .show=${true}></test-presence-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;
      await aTimeout(140);
      await el.updateComplete;

      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');
    });
  });

  describe('callbacks', () => {
    it('calls onExitComplete when exit finishes', async () => {
      const onExitComplete = vi.fn();

      class TestCallbackHost extends LitElement {
        @property({ type: Boolean }) show = true;
        presence = new PresenceController(this, {
          isPresent: () => this.show,
          onExitComplete,
        });
        override render() { return html`<div>content</div>`; }
      }
      if (!customElements.get('test-callback-host')) {
        customElements.define('test-callback-host', TestCallbackHost);
      }

      const el = await fixture<TestCallbackHost>(
        html`<test-callback-host></test-callback-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(onExitComplete).toHaveBeenCalledOnce();
    });

    it('calls onStatusChange on each transition', async () => {
      const statuses: PresenceStatus[] = [];

      class TestStatusHost extends LitElement {
        @property({ type: Boolean }) show = false;
        presence = new PresenceController(this, {
          isPresent: () => this.show,
          onStatusChange: (s) => statuses.push(s),
        });
        override render() { return html`<div>content</div>`; }
      }
      if (!customElements.get('test-status-host')) {
        customElements.define('test-status-host', TestStatusHost);
      }

      const el = await fixture<TestStatusHost>(
        html`<test-status-host></test-status-host>`,
      );
      await el.updateComplete;

      el.show = true;
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(statuses).to.include('starting');
      expect(statuses).to.include('idle');
    });
  });

  describe('disconnect cleanup', () => {
    it('removes listeners on disconnect', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host .show=${true}></test-presence-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;

      // Disconnect while exit is pending
      el.remove();

      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');

      // Should not throw or leak
      const target = el.shadowRoot!.getElementById('target')!;
      target.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true }));
    });
  });
});
