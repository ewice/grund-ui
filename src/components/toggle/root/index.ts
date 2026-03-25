import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';

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
   */
  @property({ type: Boolean })
  public pressed: boolean | undefined = undefined;

  /**
   * Initial pressed state for uncontrolled mode. Ignored after the first render.
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

  private get effectivePressed(): boolean {
    return this.pressed ?? this.internalPressed;
  }

  protected override willUpdate(_changed: Map<PropertyKey, unknown>): void {
    // Seed internal state from defaultPressed on first render only.
    if (!this.hasUpdated) {
      this.internalPressed = this.defaultPressed;
    }

    this.toggleAttribute('data-pressed', this.effectivePressed);
    this.toggleAttribute('data-disabled', this.disabled);
  }

  private handleClick(): void {
    if (this.disabled) return;

    const newPressed = !this.effectivePressed;

    // Uncontrolled: update internal state so the element re-renders.
    // Controlled: fire only — consumer must update `pressed` to change display.
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
    return html`
      <button
        part="button"
        type="button"
        ?disabled=${this.disabled}
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
