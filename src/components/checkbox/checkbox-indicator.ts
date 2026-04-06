import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { checkboxContext } from './checkbox.context';
import type { CheckboxContext } from './checkbox.context';

/**
 * Visual indicator for <grund-checkbox>. Place inside <grund-checkbox> to slot a
 * custom checkmark or dash icon. Visibility is controlled by consumers via CSS
 * on the reflected data-checked, data-unchecked, and data-indeterminate attributes.
 *
 * @element grund-checkbox-indicator
 * @slot - Custom checkmark or dash icon
 * @csspart indicator - The wrapper span element
 */
export class GrundCheckboxIndicator extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline; /* inline: indicator sits inline within the checkbox label */
    }
  `;

  @consume({ context: checkboxContext, subscribe: true })
  @state()
  private _ctx: CheckboxContext | undefined = undefined;

  protected override updated(): void {
    if (import.meta.env.DEV) {
      // Check context presence rather than DOM traversal — closest() cannot cross shadow boundaries.
      if (this._ctx === undefined) {
        console.warn(
          '[grund-checkbox-indicator] Must be used inside <grund-checkbox>. ' +
            'Wrap this element in <grund-checkbox>.',
        );
      }
    }
  }

  protected override willUpdate(): void {
    const checked = this._ctx?.checked ?? false;
    const indeterminate = this._ctx?.indeterminate ?? false;

    this.toggleAttribute('data-checked', !indeterminate && checked);
    this.toggleAttribute('data-unchecked', !indeterminate && !checked);
    this.toggleAttribute('data-indeterminate', indeterminate);
  }

  protected override render() {
    return html`
      <span part="indicator">
        <slot></slot>
      </span>
    `;
  }
}

if (!customElements.get('grund-checkbox-indicator')) {
  customElements.define('grund-checkbox-indicator', GrundCheckboxIndicator);
}
