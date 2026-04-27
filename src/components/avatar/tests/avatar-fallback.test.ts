import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';

import { flush, getByPart } from '../../../test-utils/test-utils';
import '../avatar';
import '../avatar-image';
import '../avatar-fallback';

import type { GrundAvatar } from '../avatar';
import type { GrundAvatarFallback } from '../avatar-fallback';

const ONE_PX_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";

async function waitFor(predicate: () => boolean, timeoutMs = 500): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) { throw new Error('waitFor: timeout'); }
    await new Promise<void>((r) => setTimeout(r, 10));
  }
}

describe('GrundAvatarFallback', () => {
  it('is visible when no image is present (status=idle)', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-fallback>JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback') as GrundAvatarFallback;
    expect(fb.hasAttribute('data-visible')).to.be.true;
    expect(getComputedStyle(fb).display).to.not.equal('none');
  });

  it('is visible when image errors', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src="not-a-real-url-12345.png" alt="x"></grund-avatar-image>
        <grund-avatar-fallback>JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback') as GrundAvatarFallback;
    await waitFor(() => fb.hasAttribute('data-visible'));
    expect(fb.hasAttribute('data-visible')).to.be.true;
  });

  it('is visible while image has not loaded', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-fallback>JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback') as GrundAvatarFallback;
    const image = document.createElement('grund-avatar-image');
    image.setAttribute('src', 'not-a-real-url-12345.png');
    image.setAttribute('alt', 'x');

    el.insertBefore(image, fb);
    await flush(el);

    expect(fb.hasAttribute('data-visible')).to.be.true;
  });

  it('is hidden when image loads successfully', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="x"></grund-avatar-image>
        <grund-avatar-fallback>JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback') as GrundAvatarFallback;
    await waitFor(() => !fb.hasAttribute('data-visible'));
    expect(fb.hasAttribute('data-visible')).to.be.false;
  });

  it('renders a shadow wrapper with part="fallback"', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar><grund-avatar-fallback>JD</grund-avatar-fallback></grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback') as GrundAvatarFallback;
    expect(getByPart(fb, 'fallback')).to.exist;
  });

  it('defers visibility when delay > 0', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-fallback delay="100">JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback') as GrundAvatarFallback;
    // Immediately after mount, delay has not elapsed.
    expect(fb.hasAttribute('data-visible')).to.be.false;
    // After delay, it flips visible.
    await new Promise<void>((r) => setTimeout(r, 150));
    await flush(el);
    expect(fb.hasAttribute('data-visible')).to.be.true;
  });

  it('clears the delay timer on disconnect', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-fallback delay="5000">JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback') as GrundAvatarFallback;
    el.removeChild(fb);
    // If the timer wasn't cleared, a later tick would still flip the (now detached) element's attribute.
    await new Promise<void>((r) => setTimeout(r, 50));
    expect(fb.hasAttribute('data-visible')).to.be.false;
  });

});
