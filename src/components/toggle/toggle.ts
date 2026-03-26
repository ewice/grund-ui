import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { toggleGroupRootContext } from '../toggle-group/toggle-group.context';
import type { ToggleGroupRootContext } from '../toggle-group/toggle-group.context';
import type { PressedChangeDetail } from './types';

export class GrundToggle extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline;
    }
  `;

  @property({ type: Boolean })
  public pressed: boolean | undefined = undefined;

  @property({ type: Boolean, attribute: 'default-pressed' })
  public defaultPressed = false;

  @property()
  public value = '';

  @property({ type: Boolean })
  public disabled = false;

  @state()
  private internalPressed = false;

  @consume({ context: toggleGroupRootContext, subscribe: true })
  @state()
  private readonly _groupCtx: ToggleGroupRootContext | undefined = undefined;

  private _isRegistered = false;

  private get effectivePressed(): boolean {
    if (this._groupCtx) {
      return this._groupCtx.isPressed(this.value);
    }

    return this.pressed ?? this.internalPressed;
  }

  private get effectiveDisabled(): boolean {
    if (this._groupCtx) {
      return this._groupCtx.isDisabled(this.disabled);
    }

    return this.disabled;
  }

  protected override willUpdate(_changed: Map<PropertyKey, unknown>): void {
    if (!this.hasUpdated && !this._groupCtx) {
      this.internalPressed = this.defaultPressed;
    }

    this.toggleAttribute('data-pressed', this.effectivePressed);
    this.toggleAttribute('data-disabled', this.effectiveDisabled);
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('_groupCtx')) {
      const prev = changed.get('_groupCtx') as ToggleGroupRootContext | undefined;
      if (prev && this._isRegistered) {
        prev.unregisterToggle(this);
        this._isRegistered = false;
      }
      if (this._groupCtx) {
        this._groupCtx.registerToggle(this, this.value);
        this._isRegistered = true;
      }
    }

    if (changed.has('value') && this._groupCtx && this._isRegistered) {
      this._groupCtx.unregisterToggle(this);
      this._groupCtx.registerToggle(this, this.value);
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._isRegistered && this._groupCtx) {
      this._groupCtx.unregisterToggle(this);
      this._isRegistered = false;
    }
  }

  private handleClick(): void {
    if (this.effectiveDisabled) {
      return;
    }

    if (this._groupCtx) {
      const resolvedPressed = this._groupCtx.requestToggle(this.value, this.disabled);

      if (resolvedPressed === null) {
        return;
      }

      this.dispatchEvent(
        new CustomEvent<PressedChangeDetail>('grund-pressed-change', {
          detail: { pressed: resolvedPressed },
          bubbles: true,
          composed: false,
        }),
      );

      return;
    }

    const newPressed = !this.effectivePressed;
    if (this.pressed === undefined) {
      this.internalPressed = newPressed;
    }

    this.dispatchEvent(
      new CustomEvent<PressedChangeDetail>('grund-pressed-change', {
        detail: { pressed: newPressed },
        bubbles: true,
        composed: false,
      }),
    );
  }

  protected override render() {
    const inGroup = Boolean(this._groupCtx);
    return html`
      <button
        part="button"
        type="button"
        ?disabled=${!inGroup && this.effectiveDisabled}
        aria-disabled=${inGroup ? String(this.effectiveDisabled) : nothing}
        aria-pressed=${String(this.effectivePressed)}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-toggle')) {
  customElements.define('grund-toggle', GrundToggle);
}
