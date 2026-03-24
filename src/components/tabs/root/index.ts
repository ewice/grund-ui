import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { TabsController } from '../controller/tabs.controller.js';
import { TabsRegistry } from '../registry/tabs.registry.js';
import { tabsRootContext } from '../context/tabs.context.js';

import type { TabsRootContext } from '../context/tabs.context.js';
import type { TabsValueChangeDetail } from '../types.js';

/**
 * Root tabs container. Provides context to tab list, tabs, and panels.
 *
 * @element grund-tabs
 * @slot - Tab list and panel elements
 * @fires {CustomEvent<TabsValueChangeDetail>} grund-value-change - When the active tab changes
 */
export class GrundTabs extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  // Not attribute-reflected: null requires property binding, string | null | undefined
  // cannot be safely round-tripped through an attribute.
  @property({ attribute: false })
  value: string | null | undefined = undefined;

  @property({ attribute: 'default-value' })
  defaultValue: string | null = null;

  @property()
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ type: Boolean })
  disabled = false;

  @provide({ context: tabsRootContext })
  @state()
  protected rootCtx!: TabsRootContext;

  private controller = new TabsController();
  private registry = new TabsRegistry();

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    this.controller.syncFromHost(
      { value: this.value, defaultValue: this.defaultValue, disabled: this.disabled },
      this.registry.getOrderedValues(),
      this.registry.getDisabledValues(),
    );

    this.dataset.orientation = this.orientation;
    this.dataset.activationDirection = this.computeActivationDirection();

    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('disabled') ||
      changed.has('orientation')
    ) {
      this.rootCtx = this.createRootContext();
    }
  }

  private computeActivationDirection(): 'start' | 'end' | 'none' {
    if (this.controller.previousValue === null) return 'none';
    const prevIdx = this.registry.indexOf(this.controller.previousValue);
    const activeIdx = this.registry.indexOf(this.controller.activeValue!);
    if (prevIdx > activeIdx) return 'start';
    if (prevIdx < activeIdx) return 'end';
    return 'none';
  }

  private createRootContext(): TabsRootContext {
    return {
      activeValue: this.controller.activeValue,
      activationDirection: this.computeActivationDirection(),
      orientation: this.orientation,
      disabled: this.disabled,

      registerTab: (value: string, tab: HTMLElement) => {
        this.registry.registerTab(value, tab);
        // Auto-select the first enabled tab when uncontrolled and nothing is selected yet.
        // This must happen here (not in syncFromHost) because the registry is empty on the
        // first willUpdate call — tabs register themselves after the root renders.
        if (this.controller.activeValue === null && this.value === undefined) {
          const ordered = this.registry.getOrderedValues();
          const disabled = this.registry.getDisabledValues();
          const first = ordered.find((v) => !disabled.has(v));
          if (first !== undefined) {
            this.controller.requestActivation(first);
            this.rootCtx = this.createRootContext();
          }
        }
      },

      unregisterTab: (value: string) => {
        this.registry.unregisterTab(value);
      },

      registerPanel: (value: string, panel: HTMLElement) => {
        this.registry.registerPanel(value, panel);
        // Recreate context so tabs can resolve ariaControlsElements after panels register.
        this.rootCtx = this.createRootContext();
      },

      unregisterPanel: (value: string) => {
        this.registry.unregisterPanel(value);
        this.rootCtx = this.createRootContext();
      },

      setDisabled: (value: string, disabled: boolean) => {
        this.registry.setDisabled(value, disabled);
      },

      requestActivation: (value: string) => {
        this.handleActivation(value);
      },

      getTabElement: (value: string) => this.registry.getTabElement(value),
      getPanelElement: (value: string) => this.registry.getPanelElement(value),
      indexOf: (value: string) => this.registry.indexOf(value),
    };
  }

  private handleActivation(value: string): void {
    // Per-tab disabled check — registry-level guard independent of root disabled.
    if (this.registry.getRecord(value)?.disabled) return;

    const previousValue = this.controller.activeValue;
    const result = this.controller.requestActivation(value);

    if (result === null) return;

    this.dispatchEvent(
      new CustomEvent<TabsValueChangeDetail>('grund-value-change', {
        detail: { value: result, previousValue },
        bubbles: true,
        composed: false,
      }),
    );

    // Internal controller state changed without a reactive prop change, so
    // willUpdate won't fire. Recreate context manually to propagate new activeValue.
    this.rootCtx = this.createRootContext();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-tabs')) {
  customElements.define('grund-tabs', GrundTabs);
}
