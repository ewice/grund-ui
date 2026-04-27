import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { avatarContext } from './avatar.context';

import type { AvatarContext } from './avatar.context';
import type { AvatarStatus } from './types';

export class GrundAvatarImage extends LitElement {
  public static override readonly styles = css`
    :host {
      display: none;
    }
    :host([data-status='loaded']),
    :host([data-status='error']) {
      display: inline;
    }
    :host([data-status='error']) img {
      display: none;
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

  @property({ attribute: 'data-status', reflect: true })
  private hostStatus: AvatarStatus = 'idle';

  @property({ attribute: 'role', reflect: true })
  private hostRole: 'img' | null = null;

  @property({ attribute: 'aria-label', reflect: true })
  private hostAriaLabel: string | null = null;

  @consume({ context: avatarContext, subscribe: true })
  @state()
  private readonly ctx: AvatarContext | undefined;

  private readonly onLoad = (): void => {
    this.ctx?.setStatus('loaded');
  };
  private readonly onError = (): void => {
    this.ctx?.setStatus('error');
  };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const receivedContext = changed.has('ctx') && changed.get('ctx') === undefined;
    if (this.ctx !== undefined && (changed.has('src') || receivedContext)) {
      this.ctx.setStatus(this.src ? 'loading' : 'idle');
    }

    const status = this.ctx?.status ?? 'idle';
    const failedImageLabel = status === 'error' && this.alt ? this.alt : null;
    const hostRole = failedImageLabel ? 'img' : null;

    if (this.hostStatus !== status) {
      this.hostStatus = status;
    }
    if (this.hostRole !== hostRole) {
      this.hostRole = hostRole;
    }
    if (this.hostAriaLabel !== failedImageLabel) {
      this.hostAriaLabel = failedImageLabel;
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
      @load=${this.onLoad}
      @error=${this.onError}
    />`;
  }
}

if (!customElements.get('grund-avatar-image')) {
  customElements.define('grund-avatar-image', GrundAvatarImage);
}
