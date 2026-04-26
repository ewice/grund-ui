import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { avatarContext } from './avatar.context';

import type { AvatarContext } from './avatar.context';

export class GrundAvatarImage extends LitElement {
  public static override readonly styles = css`
    :host {
      display: none;
    }
    :host([data-status='loaded']),
    :host([data-status='error']) {
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

  private _warnedMissingParent = false;
  private _warnedMissingAlt = false;
  private _warnedDuplicate = false;

  private readonly _onLoad = (): void => { this._ctx?.setStatus('loaded'); };
  private readonly _onError = (): void => { this._ctx?.setStatus('error'); };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (import.meta.env.DEV) {
      this._warnForMisuse();
    }

    const receivedContext = changed.has('_ctx') && changed.get('_ctx') === undefined;
    if (this._ctx !== undefined && (changed.has('src') || receivedContext)) {
      this._ctx.setStatus(this.src ? 'loading' : 'idle');
    }

    this.dataset.status = this._ctx?.status ?? 'idle';
  }

  private _warnForMisuse(): void {
    const parent = this.parentElement;

    if (parent?.localName !== 'grund-avatar') {
      if (!this._warnedMissingParent) {
        console.warn(
          '[grund-avatar-image] Must be used inside <grund-avatar>. ' +
            'Wrap this element in <grund-avatar>.',
        );
        this._warnedMissingParent = true;
      }
      return;
    }

    if (!this.hasAttribute('alt') && !this._warnedMissingAlt) {
      console.warn('[grund-avatar-image] Missing alt attribute. Provide alt="" if decorative.');
      this._warnedMissingAlt = true;
    }

    const imageCount = Array.from(parent.children).filter(
      (child) => child.localName === 'grund-avatar-image',
    ).length;

    if (imageCount > 1 && !this._warnedDuplicate) {
      console.warn(
        '[grund-avatar-image] Found more than one <grund-avatar-image>. ' +
          'Use a single image inside each <grund-avatar>.',
      );
      this._warnedDuplicate = true;
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
