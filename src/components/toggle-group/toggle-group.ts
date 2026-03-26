import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { RovingFocusController } from '../../controllers/roving-focus.controller';
import { ToggleGroupEngine } from './toggle-group.engine';
import { ToggleGroupRegistry } from './toggle-group.registry';
import type { ToggleGroupRootContext } from './toggle-group.context';
import { toggleGroupRootContext } from './toggle-group.context';
import { disabledContext } from '../../context/disabled.context';
import type { ToggleGroupHostSnapshot, ToggleGroupValueChangeDetail } from './types';

export class GrundToggleGroup extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline-flex;
    }
  `;

  @property({ type: Array, hasChanged: () => true })
  public value: string[] | undefined = undefined;

  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  public defaultValue: string[] = [];

  @property({ type: Boolean })
  public multiple = false;

  @property({ type: Boolean })
  public disabled = false;

  @property()
  public orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ type: Boolean })
  public loop = true;

  @provide({ context: toggleGroupRootContext })
  @state()
  protected rootCtx!: ToggleGroupRootContext;

  @provide({ context: disabledContext })
  @state()
  protected disabledCtx = false;

  private readonly engine = new ToggleGroupEngine();
  private readonly registry = new ToggleGroupRegistry();
  private readonly rovingFocus = new RovingFocusController(this, {
    orientation: 'horizontal',
    loop: true,
    getItems: () =>
      this.registry.toggles
        .map((r) => r.element.shadowRoot?.querySelector<HTMLElement>('[part="button"]') ?? null)
        .filter((btn): btn is HTMLElement => btn !== null),
  });

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: ToggleGroupHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      multiple: this.multiple,
      disabled: this.disabled,
    };
    this.engine.syncFromHost(snapshot);

    this.rovingFocus.update({
      orientation: this.orientation,
      loop: this.loop,
    });

    this.dataset.orientation = this.orientation;
    this.toggleAttribute('data-disabled', this.disabled);
    this.disabledCtx = this.disabled;
    this.toggleAttribute('data-multiple', this.multiple);

    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('multiple') ||
      changed.has('disabled')
    ) {
      this.rootCtx = this.createRootContext();
    }
  }

  private createRootContext(): ToggleGroupRootContext {
    return {
      isPressed: (value) => this.engine.isPressed(value),
      requestToggle: (value, toggleDisabled) => this.handleToggle(value, toggleDisabled),
      registerToggle: (toggle, value) => {
        this.registry.register(toggle, value);
        this.rovingFocus.sync();
      },
      unregisterToggle: (toggle) => {
        this.registry.unregister(toggle);
        this.rovingFocus.sync();
      },
    };
  }

  private handleToggle(value: string, toggleDisabled: boolean): boolean | null {
    const result = this.engine.requestToggle(value, toggleDisabled);
    if (result === null) return null;

    const newPressed = result.includes(value);

    this.dispatchEvent(
      new CustomEvent<ToggleGroupValueChangeDetail>('grund-value-change', {
        detail: { value: result },
        bubbles: true,
        composed: false,
      }),
    );

    this.rootCtx = this.createRootContext();

    return newPressed;
  }

  protected override render() {
    return html`
      <div part="group" role="group">
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-toggle-group')) {
  customElements.define('grund-toggle-group', GrundToggleGroup);
}
