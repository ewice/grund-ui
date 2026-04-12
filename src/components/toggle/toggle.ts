import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import type { ToggleGroupRootContext } from '../toggle-group/toggle-group.context';
import { toggleGroupRootContext } from '../toggle-group/toggle-group.context';
import { disabledContext } from '../../context/disabled.context';
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

  @consume({ context: disabledContext, subscribe: true })
  @state()
  private ancestorDisabled = false;

  private _isRegistered = false;

  private get effectivePressed(): boolean {
    return this._groupCtx?.isPressed(this.value) ?? this.pressed ?? this.internalPressed;
  }

  private get effectiveDisabled(): boolean {
    return this.ancestorDisabled || this.disabled;
  }

  protected override willUpdate(): void {
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

      this.registerWithGroup();
    }

    if (changed.has('value') && this._isRegistered) {
      this.reregisterWithGroup();
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unregisterFromGroup();
  }

  private registerWithGroup(): void {
    if (!this._groupCtx) {
      return;
    }

    this._groupCtx.registerToggle(this, this.value);
    this._isRegistered = true;
  }

  private unregisterFromGroup(): void {
    if (!this._isRegistered || !this._groupCtx) {
      return;
    }

    this._groupCtx.unregisterToggle(this);
    this._isRegistered = false;
  }

  private reregisterWithGroup(): void {
    if (!this._isRegistered || !this._groupCtx) {
      return;
    }

    this._groupCtx.unregisterToggle(this);
    this._groupCtx.registerToggle(this, this.value);
  }

  private handleClick(): void {
    if (this.effectiveDisabled) {
      return;
    }

    if (this._groupCtx) {
      this.pressInGroup(this._groupCtx);
    } else {
      this.pressStandalone();
    }
  }

  private pressInGroup(ctx: ToggleGroupRootContext): void {
    const resolvedPressed = ctx.requestToggle(this.value, this.disabled);

    if (resolvedPressed !== null) {
      this.emitPressedChange(resolvedPressed);
    }
  }

  private pressStandalone(): void {
    const newPressed = !this.effectivePressed;

    if (this.pressed === undefined) {
      this.internalPressed = newPressed;
    }

    this.emitPressedChange(newPressed);
  }

  private emitPressedChange(pressed: boolean): void {
    this.dispatchEvent(
      new CustomEvent<PressedChangeDetail>('grund-pressed-change', {
        detail: { pressed },
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

export type { PressedChangeDetail } from './types';
