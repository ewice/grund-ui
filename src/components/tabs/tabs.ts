import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { TabsEngine } from './tabs.engine';
import { TabsRegistry } from './tabs.registry';
import { tabsRootContext } from './tabs.context';
import { disabledContext } from '../../context/disabled.context';

import type { TabsRootContext } from './tabs.context';
import type { TabsHostSnapshot, TabsValueChangeDetail } from './types';

export class GrundTabs extends LitElement {
  public static override styles = css`
    :host {
      display: block;
    }
  `;

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

  @provide({ context: disabledContext })
  @state()
  protected disabledCtx = false;

  private controller = new TabsEngine();
  private registry = new TabsRegistry();
  private activationDirection: 'start' | 'end' | 'none' = 'none';

  private readonly registerTab = (value: string, tab: HTMLElement): void => {
    this.registry.registerTab(value, tab);

    if (this.controller.activeValue === null && this.value === undefined) {
      const ordered = this.registry.getOrderedValues();
      const disabled = this.registry.getDisabledValues();
      const first = ordered.find((v) => !disabled.has(v));

      if (first !== undefined) {
        this.controller.seed(first);
        this.rootCtx = this.createRootContext();
      }
    }
  };

  private readonly unregisterTab = (value: string): void => {
    this.registry.unregisterTab(value);
    this.rootCtx = this.createRootContext();
  };

  private readonly registerPanel = (value: string, panel: HTMLElement): void => {
    this.registry.registerPanel(value, panel);
    this.rootCtx = this.createRootContext();
  };

  private readonly unregisterPanel = (value: string): void => {
    this.registry.unregisterPanel(value);
    this.rootCtx = this.createRootContext();
  };

  private readonly setDisabled = (value: string, isDisabled: boolean): void => {
    this.registry.setDisabled(value, isDisabled);
  };

  private readonly requestActivation = (value: string): void => {
    this.handleActivation(value);
  };

  private readonly getTabElement = (value: string) => this.registry.getTabElement(value);
  private readonly getPanelElement = (value: string) => this.registry.getPanelElement(value);
  private readonly indexOf = (value: string) => this.registry.indexOf(value);

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: TabsHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      disabled: this.disabled,
    };
    this.controller.syncFromHost(snapshot);

    this.dataset.orientation = this.orientation;
    this.disabledCtx = this.disabled;
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
    if (this.controller.previousValue === null) {
      return 'none';
    }

    const prevIdx = this.registry.indexOf(this.controller.previousValue);
    const activeIdx =
      this.controller.activeValue !== null
        ? this.registry.indexOf(this.controller.activeValue)
        : -1;

    if (prevIdx < 0 || activeIdx < 0) {
      return 'none';
    }

    if (prevIdx > activeIdx) {
      return 'start';
    }

    if (prevIdx < activeIdx) {
      return 'end';
    }

    return 'none';
  }

  private createRootContext(): TabsRootContext {
    return {
      activeValue: this.controller.activeValue,
      activationDirection: this.activationDirection,
      orientation: this.orientation,
      registerTab: this.registerTab,
      unregisterTab: this.unregisterTab,
      registerPanel: this.registerPanel,
      unregisterPanel: this.unregisterPanel,
      setDisabled: this.setDisabled,
      requestActivation: this.requestActivation,
      getTabElement: this.getTabElement,
      getPanelElement: this.getPanelElement,
      indexOf: this.indexOf,
    };
  }

  private handleActivation(value: string): void {
    if (this.registry.getRecord(value)?.disabled) {
      return;
    }

    const previousValue = this.controller.activeValue;
    const result = this.controller.requestActivation(value);

    if (result === null) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<TabsValueChangeDetail>('grund-value-change', {
        detail: { value: result, previousValue },
        bubbles: true,
        composed: false,
      }),
    );

    this.rootCtx = this.createRootContext();
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-tabs')) {
  customElements.define('grund-tabs', GrundTabs);
}
