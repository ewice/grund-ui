import { fixture, html, expect } from '@open-wc/testing';
import { describe, it, vi } from 'vitest';

import { flush, getByPart } from '../../../test-utils/test-utils';
import '../avatar';
import '../avatar-image';

import type { GrundAvatar } from '../avatar';
import type { GrundAvatarImage } from '../avatar-image';

const ONE_PX_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";

async function waitFor(el: Element, predicate: () => boolean, timeoutMs = 500): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) { throw new Error('waitFor: timeout'); }
    await new Promise<void>((r) => setTimeout(r, 10));
    await (el as GrundAvatar).updateComplete;
  }
}

describe('GrundAvatarImage', () => {
  it('renders an internal <img> with part="image"', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="x"></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(el);
    const image = el.querySelector('grund-avatar-image') as GrundAvatarImage;
    const img = getByPart<HTMLImageElement>(image, 'image');
    expect(img.tagName).to.equal('IMG');
  });

  it('forwards src, alt, srcset, sizes, crossorigin, referrerpolicy, decoding, loading, fetchpriority to internal <img>', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image
          src=${ONE_PX_SVG}
          alt="Jane"
          srcset="${ONE_PX_SVG} 1x"
          sizes="32px"
          crossorigin="anonymous"
          referrerpolicy="no-referrer"
          decoding="async"
          loading="lazy"
          fetchpriority="high"
        ></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(el);
    const image = el.querySelector('grund-avatar-image') as GrundAvatarImage;
    const img = getByPart<HTMLImageElement>(image, 'image');
    expect(img.getAttribute('src')).to.equal(ONE_PX_SVG);
    expect(img.getAttribute('alt')).to.equal('Jane');
    expect(img.getAttribute('srcset')).to.contain(ONE_PX_SVG);
    expect(img.getAttribute('sizes')).to.equal('32px');
    expect(img.getAttribute('crossorigin')).to.equal('anonymous');
    expect(img.getAttribute('referrerpolicy')).to.equal('no-referrer');
    expect(img.getAttribute('decoding')).to.equal('async');
    expect(img.getAttribute('loading')).to.equal('lazy');
    expect(img.getAttribute('fetchpriority')).to.equal('high');
  });

  it('reports status=loaded on the root when image loads', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="x"></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(el);
    await waitFor(el, () => el.getAttribute('data-status') === 'loaded');
    expect(el.getAttribute('data-status')).to.equal('loaded');
  });

  it('reports status=error on the root when image fails to load', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src="not-a-real-url-12345.png" alt="x"></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(el);
    await waitFor(el, () => el.getAttribute('data-status') === 'error');
    expect(el.getAttribute('data-status')).to.equal('error');
  });

  it('reports status=idle when src is removed', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="x"></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(el);
    const image = el.querySelector('grund-avatar-image') as GrundAvatarImage;
    await waitFor(el, () => el.getAttribute('data-status') === 'loaded');
    image.removeAttribute('src');
    await flush(el);
    await waitFor(el, () => el.getAttribute('data-status') === 'idle');
    expect(el.getAttribute('data-status')).to.equal('idle');
  });

  it('host reflects its own data-status from context', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="x"></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(el);
    const image = el.querySelector('grund-avatar-image') as GrundAvatarImage;
    await waitFor(el, () => image.getAttribute('data-status') === 'loaded');
    expect(image.getAttribute('data-status')).to.equal('loaded');
  });

  it('DEV: warns when missing alt', async () => {
    if (!import.meta.env.DEV) { return; }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG}></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(document.body);
    const messages = warn.mock.calls.map((c) => c[0]).filter((m) => typeof m === 'string');
    expect(messages.some((m) => m.includes('[grund-avatar-image]') && m.includes('alt'))).to.be.true;
    warn.mockRestore();
  });

  it('DEV: warns when two <grund-avatar-image> siblings exist', async () => {
    if (!import.meta.env.DEV) { return; }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="a"></grund-avatar-image>
        <grund-avatar-image src=${ONE_PX_SVG} alt="b"></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(document.body);
    const messages = warn.mock.calls.map((c) => c[0]).filter((m) => typeof m === 'string');
    expect(messages.some((m) => m.includes('[grund-avatar-image]') && m.includes('more than one'))).to.be.true;
    warn.mockRestore();
  });

  it('DEV: warns when used outside <grund-avatar>', async () => {
    if (!import.meta.env.DEV) { return; }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await fixture(html`<grund-avatar-image src=${ONE_PX_SVG} alt="x"></grund-avatar-image>`);
    await flush(document.body);
    const messages = warn.mock.calls.map((c) => c[0]).filter((m) => typeof m === 'string');
    expect(messages.some((m) => m.includes('[grund-avatar-image]') && m.includes('<grund-avatar>'))).to.be.true;
    warn.mockRestore();
  });
});
