import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { avatarContext } from './avatar.context';

import type { AvatarContext } from './avatar.context';

/**
 * Image sub-element for the Avatar compound component.
 * Renders an internal `<img>` and reports load/error status to the root via context.
 *
 * @element grund-avatar-image
 * @csspart image - Internal `<img>` element
 */
export class GrundAvatarImage extends LitElement {
  public static override readonly styles = css`
    :host {
      display: none;
      /* display:none (not visibility:hidden) so the image reserves no layout space while loading */
    }
    :host([data-status='loaded']) {
      display: inline; /* reveal once status reflects successful load */
    }
  `;

  @property() public src: string | null = null;
  @property() public alt: string | null = null;
  @property() public srcset: string | null = null;
  @property() public sizes: string | null = null;
  @property() public crossorigin: string | null = null;
  @property({ attribute: 'referrerpolicy' }) public referrerpolicy: string | null = null;
  @property() public decoding: string | null = null;
  @property() public loading: string | null = null;
  @property({ attribute: 'fetchpriority' }) public fetchpriority: string | null = null;

  @consume({ context: avatarContext, subscribe: true })
  @state()
  private _ctx: AvatarContext | undefined;

  private _warnedAlt = false;

  private readonly _onLoad = (): void => { this._ctx?.setStatus('loaded'); };
  private readonly _onError = (): void => { this._ctx?.setStatus('error'); };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (this._ctx === undefined) {
      if (import.meta.env.DEV) {
        console.warn(
          '[grund-avatar-image] Must be used inside <grund-avatar>. Wrap this element in <grund-avatar>.',
        );
      }
    }

    if (this._ctx !== undefined && changed.has('src')) {
      if (this.src) {
        this._ctx.setStatus('loading');
      } else {
        this._ctx.setStatus('idle');
      }
    }

    this.dataset.status = this._ctx?.status ?? 'idle';

    if (import.meta.env.DEV && this.alt === null && !this._warnedAlt) {
      console.warn(
        '[grund-avatar-image] missing alt attribute. Provide alt="" if decorative.',
      );
      this._warnedAlt = true;
    }
  }

  protected override render() {
    return html`<img
      part="image"
      src=${this.src ?? nothing}
      alt=${this.alt ?? ''}
      srcset=${this.srcset ?? nothing}
      sizes=${this.sizes ?? nothing}
      crossorigin=${this.crossorigin ?? nothing}
      referrerpolicy=${this.referrerpolicy ?? nothing}
      decoding=${this.decoding ?? nothing}
      loading=${this.loading ?? nothing}
      fetchpriority=${this.fetchpriority ?? nothing}
      @load=${this._onLoad}
      @error=${this._onError}
    />`;
  }
}

if (!customElements.get('grund-avatar-image')) {
  customElements.define('grund-avatar-image', GrundAvatarImage);
}
