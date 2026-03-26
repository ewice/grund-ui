import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { TabsEngine } from '../engine/tabs.engine.js';
import { TabsRegistry } from '../registry/tabs.registry.js';
import { tabsRootContext } from '../context/tabs.context.js';

import type { TabsRootContext } from '../context/tabs.context.js';
import type { TabsHostSnapshot, TabsValueChangeDetail } from '../types.js';

/**
 * Root tabs container. Provides context to tab list, tabs, and panels.
 *
 * @element grund-tabs
 * @slot - Tab list and panel elements
 * @fires {CustomEvent<TabsValueChangeDetail>} grund-value-change - When the active tab changes
 */
export class GrundTabs extends LitElement {
  public static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  // Not attribute-reflected: null requires property binding, string | null | undefined
  // cannot be safely round-tripped through an attribute.
  @property({ attribute: false })
  public value: string | null | undefined = undefined;

  @property({ attribute: 'default-value' })
  public defaultValue: string | null = null;

  @property()
  public orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ type: Boolean })
  public disabled = false;

  @provide({ context: tabsRootContext })
  @state()
  protected rootCtx!: TabsRootContext;

  private controller = new TabsEngine();
  private registry = new TabsRegistry();
  private activationDirection: 'start' | 'end' | 'none' = 'none';

  // Stable bound callbacks — defined as class fields so object identity is preserved across
  // createRootContext() calls. Lit context consumers re-render when context reference changes;
  // stable callbacks avoid triggering unnecessary re-renders on unrelated state updates.
  private readonly _registerTab = (value: string, tab: HTMLElement): void => {
    this.registry.registerTab(value, tab);
    // Auto-select the first enabled tab when uncontrolled and nothing is selected yet.
    // This must happen here (not in syncFromHost) because the registry is empty on the
    // first willUpdate call — tabs register themselves after the root renders.
    if (this.controller.activeValue === null && this.value === undefined) {
      const ordered = this.registry.getOrderedValues();
      const disabled = this.registry.getDisabledValues();
      const first = ordered.find((v) => !disabled.has(v));
      if (first !== undefined) {
        // Use seed() rather than requestActivation() so that a disabled root
        // still gets its first tab auto-selected. Disabled blocks user
        // interaction, not initial state seeding.
        this.controller.seed(first);
        this.rootCtx = this.createRootContext();
      }
    }
  };

  private readonly _unregisterTab = (value: string): void => {
    this.registry.unregisterTab(value);
    this.rootCtx = this.createRootContext();
  };

  private readonly _registerPanel = (value: string, panel: HTMLElement): void => {
    this.registry.registerPanel(value, panel);
    // Recreate context so tabs can resolve ariaControlsElements after panels register.
    this.rootCtx = this.createRootContext();
  };

  private readonly _unregisterPanel = (value: string): void => {
    this.registry.unregisterPanel(value);
    this.rootCtx = this.createRootContext();
  };

  private readonly _setDisabled = (value: string, isDisabled: boolean): void => {
    this.registry.setDisabled(value, isDisabled);
  };

  private readonly _requestActivation = (value: string): void => {
    this.handleActivation(value);
  };

  private readonly _isEffectivelyDisabled = (tabDisabled: boolean): boolean =>
    this.controller.isEffectivelyDisabled(tabDisabled);

  private readonly _getTabElement = (value: string) => this.registry.getTabElement(value);
  private readonly _getPanelElement = (value: string) => this.registry.getPanelElement(value);
  private readonly _indexOf = (value: string) => this.registry.indexOf(value);

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: TabsHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      disabled: this.disabled,
    };
    this.controller.syncFromHost(snapshot);

    this.dataset.orientation = this.orientation;
    this.activationDirection = this.computeActivationDirection();
    this.dataset.activationDirection = this.activationDirection;

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
    const activeIdx = this.controller.activeValue !== null
      ? this.registry.indexOf(this.controller.activeValue)
      : -1;
    if (prevIdx < 0 || activeIdx < 0) return 'none';
    if (prevIdx > activeIdx) return 'start';
    if (prevIdx < activeIdx) return 'end';
    return 'none';
  }

  private createRootContext(): TabsRootContext {
    return {
      activeValue: this.controller.activeValue,
      activationDirection: this.activationDirection,
      orientation: this.orientation,
      isEffectivelyDisabled: this._isEffectivelyDisabled,
      registerTab: this._registerTab,
      unregisterTab: this._unregisterTab,
      registerPanel: this._registerPanel,
      unregisterPanel: this._unregisterPanel,
      setDisabled: this._setDisabled,
      requestActivation: this._requestActivation,
      getTabElement: this._getTabElement,
      getPanelElement: this._getPanelElement,
      indexOf: this._indexOf,
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

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-tabs')) {
  customElements.define('grund-tabs', GrundTabs);
}
