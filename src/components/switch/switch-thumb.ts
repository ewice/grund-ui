import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { switchContext } from './switch.context';
import type { SwitchContext } from './switch.context';

/**
 * Visual indicator for <grund-switch>. Place inside <grund-switch> to slot a
 * custom knob icon. Visibility and position are controlled by consumers via CSS
 * on the reflected data-checked, data-unchecked, data-disabled, data-readonly,
 * and data-required attributes.
 *
 * @element grund-switch-thumb
 * @slot - Custom knob icon or content
 * @csspart thumb - The wrapper span element
 */
export class GrundSwitchThumb extends LitElement {
  static override readonly styles = css`
    :host {
      display: inline;
    }
  `;

  @consume({ context: switchContext, subscribe: true })
  @state()
  private _ctx: SwitchContext | undefined = undefined;

  protected override willUpdate(): void {
    const checked = this._ctx?.checked ?? false;
    const disabled = this._ctx?.disabled ?? false;
    const readOnly = this._ctx?.readOnly ?? false;
    const required = this._ctx?.required ?? false;

    this.toggleAttribute('data-checked', checked);
    this.toggleAttribute('data-unchecked', !checked);
    this.toggleAttribute('data-disabled', disabled);
    this.toggleAttribute('data-readonly', readOnly);
    this.toggleAttribute('data-required', required);
  }

  protected override updated(): void {
    if (import.meta.env.DEV) {
      if (this._ctx === undefined) {
        console.warn(
          '[grund-switch-thumb] Must be used inside <grund-switch>. ' +
            'Wrap this element in <grund-switch>.',
        );
      }
    }
  }

  protected override render() {
    return html`
      <span part="thumb">
        <slot></slot>
      </span>
    `;
  }
}

if (!customElements.get('grund-switch-thumb')) {
  customElements.define('grund-switch-thumb', GrundSwitchThumb);
}
