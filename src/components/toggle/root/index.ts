import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { toggleGroupRootContext } from '../../toggle-group/context/toggle-group.context.js';
import type { ToggleGroupRootContext } from '../../toggle-group/context/toggle-group.context.js';
import type { PressedChangeDetail } from '../types.js';

/**
 * A standalone pressable toggle button with `aria-pressed` state.
 * Also the primitive element used inside `<grund-toggle-group>`.
 *
 * @element grund-toggle
 * @slot - Button label content
 * @fires {CustomEvent<PressedChangeDetail>} grund-pressed-change - When pressed state changes
 * @csspart button - The inner button element
 */
export class GrundToggle extends LitElement {
  public static override styles = css`
    :host { display: inline; /* inline: toggle wraps an inline button element */ }
  `;

  /**
   * Whether the toggle is pressed. Setting this enables controlled mode.
   * In controlled mode the element fires `grund-pressed-change` but does not
   * update internal state — the consumer must reflect the new value back.
   * Has no effect when inside `<grund-toggle-group>` (group owns pressed state).
   */
  @property({ type: Boolean })
  public pressed: boolean | undefined = undefined;

  /**
   * Initial pressed state for uncontrolled mode. Ignored after the first render.
   * Has no effect when inside `<grund-toggle-group>`.
   */
  @property({ type: Boolean, attribute: 'default-pressed' })
  public defaultPressed = false;

  /**
   * Identifier for this toggle. Has no effect on the standalone element;
   * used by `<grund-toggle-group>` to identify which item is pressed.
   */
  @property()
  public value = '';

  /** Whether the toggle is disabled. */
  @property({ type: Boolean })
  public disabled = false;

  @state()
  private internalPressed = false;

  // Optionally consumed — undefined when toggle is standalone.
  @consume({ context: toggleGroupRootContext, subscribe: true })
  @state()
  private _groupCtx: ToggleGroupRootContext | undefined = undefined;

  private _isRegistered = false;

  private get effectivePressed(): boolean {
    if (this._groupCtx) return this._groupCtx.isPressed(this.value);
    return this.pressed ?? this.internalPressed;
  }

  private get effectiveDisabled(): boolean {
    if (this._groupCtx) return this.disabled || this._groupCtx.disabled;
    return this.disabled;
  }

  protected override willUpdate(_changed: Map<PropertyKey, unknown>): void {
    // Seed internal state from defaultPressed on first render only (standalone mode).
    if (!this.hasUpdated && !this._groupCtx) {
      this.internalPressed = this.defaultPressed;
    }

    this.toggleAttribute('data-pressed', this.effectivePressed);
    this.toggleAttribute('data-disabled', this.effectiveDisabled);
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    // Handle group context arriving or changing.
    if (changed.has('_groupCtx')) {
      const prev = changed.get('_groupCtx') as ToggleGroupRootContext | undefined;
      if (prev && this._isRegistered) {
        prev.unregisterToggle(this);
        this._isRegistered = false;
      }
      if (this._groupCtx) {
        if (import.meta.env.DEV && !this.value) {
          console.warn(
            '[grund-toggle] No value prop set on <grund-toggle> inside a <grund-toggle-group>. ' +
              'Each toggle inside a group must have a unique value prop.',
          );
        }
        this._groupCtx.registerToggle(this, this.value);
        this._isRegistered = true;
      }
    }

    // Re-register if value changes while already in a group.
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
    if (this.effectiveDisabled) return;

    if (this._groupCtx) {
      // Delegate state resolution to the group.
      // requestToggle returns the resolved pressed state for this specific toggle,
      // which may differ from !effectivePressed in single mode.
      const resolvedPressed = this._groupCtx.requestToggle(this.value, this.disabled);
      if (resolvedPressed === null) return;

      this.dispatchEvent(
        new CustomEvent<PressedChangeDetail>('grund-pressed-change', {
          detail: { pressed: resolvedPressed },
          bubbles: true,
          composed: false,
        }),
      );
      return;
    }

    // Standalone mode: manage own internal state.
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
