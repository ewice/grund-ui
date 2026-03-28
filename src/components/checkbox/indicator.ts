import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { checkboxContext } from './context/checkbox.context';
import type { CheckboxContext } from './context/checkbox.context';

/**
 * Visual indicator for the checkbox state. Place inside `<grund-checkbox>`.
 *
 * @element grund-checkbox-indicator
 * @slot - Custom checkmark or dash icon content
 * @csspart indicator - The indicator wrapper
 */
export class GrundCheckboxIndicator extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline; /* inline: indicator is an inline element */
    }
  `;

  @consume({ context: checkboxContext, subscribe: true })
  @state()
  private _ctx: CheckboxContext | undefined = undefined;

  private _warnedMissingContext = false;

  protected override willUpdate(): void {
    if (import.meta.env.DEV && !this._ctx && !this._warnedMissingContext) {
      this._warnedMissingContext = true;
      requestAnimationFrame(() => {
        if (!this._ctx) {
          console.warn(
            '[grund-checkbox-indicator] Must be used inside <grund-checkbox>. ' +
            'Wrap this element in <grund-checkbox>.',
          );
        }
      });
    }

    const checked = this._ctx?.checked ?? false;
    const indeterminate = this._ctx?.indeterminate ?? false;
    this.toggleAttribute('data-checked', checked && !indeterminate);
    this.toggleAttribute('data-unchecked', !checked && !indeterminate);
    this.toggleAttribute('data-indeterminate', indeterminate);

    // Prevent indicator content from polluting the checkbox's accessible name
    this.setAttribute('aria-hidden', 'true');
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
