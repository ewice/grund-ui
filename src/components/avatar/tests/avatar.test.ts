import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';

import { flush, getByPart } from '../../../test-utils/test-utils';
import '../avatar';

import type { GrundAvatar } from '../avatar';
import type { AvatarStatusChangeDetail } from '../types';

const ONE_PX_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>";

describe('GrundAvatar (root)', () => {
  async function setup(template = html`<grund-avatar></grund-avatar>`) {
    const el = await fixture<GrundAvatar>(template);
    await flush(el);
    return el;
  }

  it('mounts and exposes part="root" on host', async () => {
    const el = await setup();
    // Host carries part="root" via shadow wrapper element.
    const root = getByPart<HTMLElement>(el, 'root');
    expect(root).to.exist;
  });

  it('starts with data-status="idle" when no image is present', async () => {
    const el = await setup();
    expect(el.getAttribute('data-status')).to.equal('idle');
  });

  it('adds no ARIA role of its own', async () => {
    const el = await setup();
    expect(el.getAttribute('role')).to.be.null;
    expect(el.getAttribute('aria-label')).to.be.null;
  });

  it('reflects data-status to "loaded" when child image loads', async () => {
    const el = await setup(html`
      <grund-avatar>
        <grund-avatar-image src=${ONE_PX_SVG} alt="Pixel"></grund-avatar-image>
      </grund-avatar>
    `);
    await flush(el);
    // Wait for <img> load event to propagate.
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    await flush(el);
    expect(el.getAttribute('data-status')).to.equal('loaded');
  });

  it('dispatches grund-status-change when status transitions', async () => {
    const el = await setup(html`<grund-avatar></grund-avatar>`);
    const events: AvatarStatusChangeDetail[] = [];
    el.addEventListener('grund-status-change', (e) =>
      events.push((e as CustomEvent<AvatarStatusChangeDetail>).detail),
    );

    // Append image with a bad src to force error transition.
    const img = document.createElement('grund-avatar-image');
    img.setAttribute('src', 'not-a-real-url-12345.png');
    img.setAttribute('alt', 'x');
    el.appendChild(img);
    await flush(el);
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    await flush(el);

    const statuses = events.map((e) => e.status);
    expect(statuses).to.include('loading');
    expect(statuses).to.include('error');
  });

  it('grund-status-change is bubbles:true, composed:false', async () => {
    const el = await setup();
    let captured: Event | null = null;
    el.addEventListener('grund-status-change', (e) => (captured = e));

    // Trigger a status change by appending an image with src.
    const img = document.createElement('grund-avatar-image');
    img.setAttribute('src', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>');
    img.setAttribute('alt', 'x');
    el.appendChild(img);
    await flush(el);
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    await flush(el);

    expect(captured, 'no event dispatched').to.exist;
    expect((captured as unknown as Event).bubbles).to.be.true;
    expect((captured as unknown as Event).composed).to.be.false;
  });
});
