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
      /* Hidden until image loads — visibility is driven by data-status attribute */
    }
    :host([data-status='loaded']) {
      display: inline;
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

  private _previousSrc: string | null = null;
  private _warnedAlt = false;

  private _imgLoadHandler: (() => void) | null = null;
  private _imgErrorHandler: (() => void) | null = null;

  public override connectedCallback(): void {
    super.connectedCallback();

    if (import.meta.env.DEV) {
      queueMicrotask(() => {
        const count = this.parentElement?.querySelectorAll('grund-avatar-image').length ?? 0;
        if (count > 1) {
          console.warn(
            '[grund-avatar-image] more than one <grund-avatar-image> inside a <grund-avatar>. Use at most one.',
          );
        }
      });
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    const img = this.shadowRoot?.querySelector('img');
    if (img) {
      if (this._imgLoadHandler) { img.removeEventListener('load', this._imgLoadHandler); }
      if (this._imgErrorHandler) { img.removeEventListener('error', this._imgErrorHandler); }
    }
    this._imgLoadHandler = null;
    this._imgErrorHandler = null;
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (this._ctx === undefined) {
      if (import.meta.env.DEV) {
        console.warn(
          '[grund-avatar-image] Must be used inside <grund-avatar>. Wrap this element in <grund-avatar>.',
        );
      }
    }

    if (this._ctx !== undefined && changed.has('src')) {
      if (this.src && this.src !== this._previousSrc) {
        this._ctx.setStatus('loading');
      } else if (!this.src) {
        this._ctx.setStatus('idle');
      }
      this._previousSrc = this.src;
    }

    this.dataset.status = this._ctx?.status ?? 'idle';

    if (import.meta.env.DEV && this.alt === null && !this._warnedAlt) {
      console.warn(
        '[grund-avatar-image] missing alt attribute. Provide alt="" if decorative.',
      );
      this._warnedAlt = true;
    }
  }

  protected override firstUpdated(): void {
    const img = this.shadowRoot!.querySelector('img')!;

    this._imgLoadHandler = () => {
      this._ctx?.setStatus('loaded');
    };
    this._imgErrorHandler = () => {
      this._ctx?.setStatus('error');
    };

    img.addEventListener('load', this._imgLoadHandler);
    img.addEventListener('error', this._imgErrorHandler);
  }

  protected override render() {
    return html`<img
      part="image"
      src=${this.src ?? nothing}
      alt=${this.alt ?? nothing}
      srcset=${this.srcset ?? nothing}
      sizes=${this.sizes ?? nothing}
      crossorigin=${this.crossorigin ?? nothing}
      referrerpolicy=${this.referrerpolicy ?? nothing}
      decoding=${this.decoding ?? nothing}
      loading=${this.loading ?? nothing}
      fetchpriority=${this.fetchpriority ?? nothing}
    />`;
  }
}

if (!customElements.get('grund-avatar-image')) {
  customElements.define('grund-avatar-image', GrundAvatarImage);
}
