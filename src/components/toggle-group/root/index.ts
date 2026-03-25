import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { RovingFocusController } from '../../../controllers/roving-focus.controller.js';
import { ToggleGroupController } from '../controller/toggle-group.controller.js';
import { ToggleGroupRegistry } from '../registry/toggle-group.registry.js';
import { toggleGroupRootContext } from '../context/toggle-group.context.js';

import type { ToggleGroupRootContext } from '../context/toggle-group.context.js';
import type { ToggleGroupHostSnapshot, ToggleGroupValueChangeDetail } from '../types.js';

/**
 * Root toggle group container. Manages selection state across child `<grund-toggle>` elements.
 *
 * @element grund-toggle-group
 * @slot - `<grund-toggle>` children
 * @fires {CustomEvent<ToggleGroupValueChangeDetail>} grund-value-change - When the set of pressed toggles changes
 * @csspart group - The inner container element
 */
export class GrundToggleGroup extends LitElement {
  public static override styles = css`
    :host { display: inline-flex; }
  `;

  /**
   * The controlled set of pressed toggle values.
   * Setting this enables controlled mode — the element fires `grund-value-change`
   * but does not update internal state; the consumer must reflect the new value back.
   */
  @property({ type: Array, hasChanged: () => true })
  public value: string[] | undefined = undefined;

  /** Initial pressed values for uncontrolled mode. Ignored after the first render. */
  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  public defaultValue: string[] = [];

  /** Whether multiple toggles can be pressed simultaneously. */
  @property({ type: Boolean }) public multiple = false;

  /** Whether all toggles in the group are disabled. */
  @property({ type: Boolean }) public disabled = false;

  /** Orientation used for keyboard navigation arrow keys. */
  @property() public orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Whether keyboard navigation wraps from last to first and vice versa. */
  @property({ type: Boolean }) public loop = true;

  @provide({ context: toggleGroupRootContext })
  @state()
  protected rootCtx!: ToggleGroupRootContext;

  private readonly controller = new ToggleGroupController();
  private readonly registry = new ToggleGroupRegistry();

  // rovingFocus declared before callbacks so `this.rovingFocus` is initialized when
  // _registerToggle / _unregisterToggle are first called.
  private readonly rovingFocus = new RovingFocusController(this, {
    orientation: 'horizontal',
    loop: true,
    getItems: () =>
      this.registry.toggles
        .map((r) => r.element.shadowRoot?.querySelector<HTMLElement>('[part="button"]') ?? null)
        .filter((btn): btn is HTMLElement => btn !== null),
  });

  // Stable bound callbacks — defined as class fields so object identity is preserved across
  // createRootContext() calls, preventing unnecessary consumer re-renders.
  private readonly _isPressed = (value: string) => this.controller.isPressed(value);

  private readonly _requestToggle = (value: string, toggleDisabled: boolean): boolean | null => {
    return this.handleToggle(value, toggleDisabled);
  };

  private readonly _registerToggle = (toggle: HTMLElement, value: string): void => {
    if (import.meta.env.DEV) {
      if (!value) {
        console.warn(
          '[grund-toggle-group] A child <grund-toggle> has no value prop. ' +
            'Each toggle inside a group must have a unique value.',
        );
      } else if (this.registry.toggles.some((r) => r.value === value)) {
        console.warn(
          `[grund-toggle-group] Duplicate value "${value}" detected. ` +
            'Each toggle inside a group must have a unique value.',
        );
      }
    }
    this.registry.register(toggle, value);
    this.rovingFocus.sync();
  };

  private readonly _unregisterToggle = (toggle: HTMLElement): void => {
    this.registry.unregister(toggle);
    this.rovingFocus.sync();
  };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: ToggleGroupHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      multiple: this.multiple,
      disabled: this.disabled,
    };
    this.controller.syncFromHost(snapshot);

    this.rovingFocus.update({
      orientation: this.orientation,
      loop: this.loop,
    });

    this.dataset.orientation = this.orientation;
    this.toggleAttribute('data-disabled', this.disabled);
    this.toggleAttribute('data-multiple', this.multiple);

    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('multiple') ||
      changed.has('disabled') ||
      changed.has('orientation')
    ) {
      this.rootCtx = this.createRootContext();
    }
  }

  private createRootContext(): ToggleGroupRootContext {
    return {
      isPressed: this._isPressed,
      disabled: this.disabled,
      requestToggle: this._requestToggle,
      registerToggle: this._registerToggle,
      unregisterToggle: this._unregisterToggle,
    };
  }

  /** Returns the resolved pressed state for the toggled item, or null if blocked. */
  private handleToggle(value: string, toggleDisabled: boolean): boolean | null {
    const result = this.controller.requestToggle(value, toggleDisabled);
    if (result === null) return null;

    const newPressed = result.includes(value);

    this.dispatchEvent(
      new CustomEvent<ToggleGroupValueChangeDetail>('grund-value-change', {
        detail: { value: result },
        bubbles: true,
        composed: false,
      }),
    );

    // Recreate context — internal controller state changed without a reactive prop change.
    this.rootCtx = this.createRootContext();

    return newPressed;
  }

  protected override render() {
    return html`<div part="group" role="group"><slot></slot></div>`;
  }
}

if (!customElements.get('grund-toggle-group')) {
  customElements.define('grund-toggle-group', GrundToggleGroup);
}
