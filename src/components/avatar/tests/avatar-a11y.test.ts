import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';

import { flush } from '../../../test-utils/test-utils';
import '../avatar';
import '../avatar-image';
import '../avatar-fallback';

import type { GrundAvatar } from '../avatar';
import type { GrundAvatarImage } from '../avatar-image';

const ONE_PX_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";

async function waitFor(predicate: () => boolean, timeoutMs = 500): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) { throw new Error('waitFor: timeout'); }
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
}

describe('GrundAvatar accessibility', () => {
  it('root adds no ARIA role, label, or aria-hidden', async () => {
    const el = await fixture<GrundAvatar>(html`<grund-avatar></grund-avatar>`);
    await flush(el);
    expect(el.getAttribute('role')).to.be.null;
    expect(el.getAttribute('aria-label')).to.be.null;
    expect(el.getAttribute('aria-hidden')).to.be.null;
  });

  it('internal <img> exposes alt to AT', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="Jane Doe"></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(el);
    const image = el.querySelector('grund-avatar-image') as GrundAvatarImage;
    const img = image.shadowRoot!.querySelector('img')!;
    expect(img.alt).to.equal('Jane Doe');
  });

  it('fallback content is announceable when not aria-hidden', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-fallback>JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback')!;
    expect(fb.getAttribute('aria-hidden')).to.be.null;
    expect(fb.textContent?.trim()).to.equal('JD');
  });

  it('consumer can silence fallback with aria-hidden when combined with an image', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="Jane Doe"></grund-avatar-image>
        <grund-avatar-fallback aria-hidden="true">JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const fb = el.querySelector('grund-avatar-fallback')!;
    expect(fb.getAttribute('aria-hidden')).to.equal('true');
  });

  it('keeps the alt-bearing image host exposed when image fails', async () => {
    const el = await fixture<GrundAvatar>(html`
      <grund-avatar>
        <grund-avatar-image src="not-a-real-url-12345.png" alt="Jane Doe"></grund-avatar-image>
        <grund-avatar-fallback aria-hidden="true">JD</grund-avatar-fallback>
      </grund-avatar>
    `);
    await flush(el);
    const image = el.querySelector('grund-avatar-image') as GrundAvatarImage;

    await waitFor(() => image.getAttribute('data-status') === 'error');

    expect(getComputedStyle(image).display).to.not.equal('none');
    expect(image.shadowRoot!.querySelector('img')!.alt).to.equal('Jane Doe');
  });
});
