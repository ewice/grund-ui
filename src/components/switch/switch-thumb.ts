import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { switchContext } from './switch.context';
import type { SwitchContext } from './switch.context';

export class GrundSwitchThumb extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline;
    }
  `;

  @consume({ context: switchContext, subscribe: true })
  @state()
  private ctx: SwitchContext | undefined = undefined;

  protected override willUpdate(): void {
    const checked = this.ctx?.checked ?? false;
    const disabled = this.ctx?.disabled ?? false;
    const readOnly = this.ctx?.readOnly ?? false;
    const required = this.ctx?.required ?? false;

    this.toggleAttribute('data-checked', checked);
    this.toggleAttribute('data-unchecked', !checked);
    this.toggleAttribute('data-disabled', disabled);
    this.toggleAttribute('data-readonly', readOnly);
    this.toggleAttribute('data-required', required);
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
