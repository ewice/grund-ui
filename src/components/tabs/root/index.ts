import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { TabsController } from '../controller/tabs.controller.js';
import { TabsRegistry } from '../registry/tabs.registry.js';
import { tabsRootContext } from '../context/tabs.context.js';

import type { TabsRootContext } from '../context/tabs.context.js';
import type { TabsHostSnapshot, TabsValueChangeDetail } from '../types.js';

/**
 * Root tabs container. Manages active tab state and provides context.
 *
 * @element grund-tabs
 * @slot - Tab list and panels
 * @fires {CustomEvent<TabsValueChangeDetail>} grund-value-change - When the active tab changes
 */
export class GrundTabs extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property({ attribute: false }) value: string | null | undefined = undefined;
  @property({ attribute: 'default-value' }) defaultValue: string | null = null;
  @property() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @property({ type: Boolean }) disabled = false;

  @provide({ context: tabsRootContext })
  @state()
  protected rootCtx!: TabsRootContext;

  private controller = new TabsController();
  private registry = new TabsRegistry();

  private _activeValue: string | null = null;
  private _activationDirection: 'start' | 'end' | 'none' = 'none';

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: TabsHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      disabled: this.disabled,
    };
    this.controller.syncFromHost(snapshot);
    this._activeValue = this.controller.activeValue;

    this.dataset.orientation = this.orientation;
    this.dataset.activationDirection = this._activationDirection;

    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('disabled') ||
      changed.has('orientation')
    ) {
      this.rootCtx = this.createContext();
    }
  }

  override firstUpdated(): void {
    if (this._activeValue === null) {
      const first = this.registry.firstNonDisabled();
      if (first) this.activateTab(first.value);
    }
  }

  private createContext(): TabsRootContext {
    return {
      activeValue: this._activeValue,
      activationDirection: this._activationDirection,
      orientation: this.orientation,
      disabled: this.disabled,
      registerTab: (tab: HTMLElement) => {
        const value = (tab as any).value as string;
        this.registry.registerTab(tab, value);
        if (this._activeValue === null) {
          const first = this.registry.firstNonDisabled();
          if (first) this.activateTab(first.value);
        }
      },
      unregisterTab: (value: string) => this.registry.unregisterTab(value),
      registerPanel: (panel: HTMLElement) => {
        const value = (panel as any).value as string;
        this.registry.attachPanel(value, panel);
        // Recreate context so tab consumers re-run updated() and set ariaControlsElements
        // to the now-available panel element reference.
        this.rootCtx = this.createContext();
      },
      unregisterPanel: (value: string) => this.registry.detachPanel(value),
      activateTab: (value: string) => this.activateTab(value),
      getRegistry: () => this.registry,
    };
  }

  activateTab(value: string): void {
    const record = this.registry.getByValue(value);
    const isDisabled = !!record?.element.hasAttribute('data-disabled');
    const previousValue = this._activeValue;
    const result = this.controller.requestActivate(value, isDisabled);
    if (result === null) return;

    const prevIndex = previousValue ? this.registry.indexOfValue(previousValue) : -1;
    const nextIndex = this.registry.indexOfValue(value);
    this._activationDirection =
      prevIndex === -1 ? 'none'
      : nextIndex < prevIndex ? 'start'
      : 'end';

    // In controlled mode, controller.activeValue is unchanged (consumer drives it).
    // In uncontrolled mode, controller.activeValue was updated to result by requestActivate.
    this._activeValue = this.controller.activeValue;
    this.dataset.activationDirection = this._activationDirection;

    this.dispatchEvent(
      new CustomEvent<TabsValueChangeDetail>('grund-value-change', {
        detail: { value: result, previousValue },
        bubbles: true,
        composed: false,
      }),
    );

    this.rootCtx = this.createContext();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-tabs')) {
  customElements.define('grund-tabs', GrundTabs);
}
