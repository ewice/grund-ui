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
});
