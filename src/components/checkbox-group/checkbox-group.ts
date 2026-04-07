import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { CheckboxGroupEngine } from './checkbox-group.engine';
import { checkboxGroupContext } from './checkbox-group.context';
import { disabledContext } from '../../context/disabled.context';

import type { CheckboxGroupContext } from './checkbox-group.context';
import type { CheckboxGroupValueChangeDetail, CheckboxGroupHostSnapshot } from './types';

export class GrundCheckboxGroup extends LitElement {
  public static override readonly styles = css`
    :host {
      display: block;
    }
  `;

  @property({ type: Array, hasChanged: () => true })
  public value: string[] | undefined = undefined;

  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  public defaultValue: string[] = [];

  @property({ type: Array, attribute: 'all-values', hasChanged: () => true })
  public allValues: string[] = [];

  @property({ type: Boolean }) public disabled = false;

  @property({ attribute: 'aria-label' }) public override ariaLabel: string | null = null;

  @property({ attribute: 'aria-labelledby' }) public ariaLabelledBy: string | null = null;

  @property({ attribute: 'aria-describedby' }) public ariaDescribedBy: string | null = null;

  @provide({ context: checkboxGroupContext })
  @state()
  protected groupCtx!: CheckboxGroupContext;

  @provide({ context: disabledContext })
  @state()
  protected disabledCtx = false;

  private readonly engine = new CheckboxGroupEngine();

  private readonly _isChecked = (value: string) => this.engine.isChecked(value);

  private readonly _getParentState = () => this.engine.getParentState();

  private readonly _requestToggle = (value: string, parent: boolean): void => {
    this._handleToggle(value, parent);
  };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: CheckboxGroupHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      allValues: this.allValues,
      disabled: this.disabled,
    };
    this.engine.syncFromHost(snapshot);

    this.toggleAttribute('data-disabled', this.disabled);
    this.disabledCtx = this.disabled;

    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('allValues') ||
      changed.has('disabled')
    ) {
      this.groupCtx = this.createGroupContext();
    }
  }

  private createGroupContext(): CheckboxGroupContext {
    return {
      isChecked: this._isChecked,
      getParentState: this._getParentState,
      requestToggle: this._requestToggle,
    };
  }

  private _handleToggle(itemValue: string, parent: boolean): void {
    let result: string[] | null;
    let checked: boolean;

    if (parent) {
      result = this.engine.requestToggleAll();

      if (result === null) {
        return;
      }

      checked =
        result.length === this.allValues.length && this.allValues.every((v) => result!.includes(v));
    } else {
      result = this.engine.requestToggle(itemValue);

      if (result === null) {
        return;
      }

      checked = result.includes(itemValue);
    }

    this.dispatchEvent(
      new CustomEvent<CheckboxGroupValueChangeDetail>('grund-value-change', {
        detail: { value: result, itemValue, checked },
        bubbles: true,
        composed: false,
      }),
    );

    this.groupCtx = this.createGroupContext();
  }

  protected override updated(): void {
    const group = this.shadowRoot?.querySelector<HTMLElement>('[part="group"]');
    if (!group) {
      return;
    }

    if (this.ariaLabelledBy) {
      group.ariaLabelledByElements = this._resolveReferencedElements(this.ariaLabelledBy);
    } else {
      group.ariaLabelledByElements = [];
    }

    if (this.ariaDescribedBy) {
      group.ariaDescribedByElements = this._resolveReferencedElements(this.ariaDescribedBy);
    } else {
      group.ariaDescribedByElements = [];
    }

    if (import.meta.env.DEV) {
      this._warnOnInvalidChildren();
    }
  }

  private _warnOnInvalidChildren(): void {
    const checkboxes = Array.from(this.querySelectorAll('grund-checkbox'));
    const nonParent = checkboxes.filter((cb) => !cb.hasAttribute('parent'));
    const seen = new Set<string>();

    for (const cb of nonParent) {
      if (!cb.hasAttribute('value')) {
        console.warn(
          '[grund-checkbox-group] A child <grund-checkbox> is missing a value attribute. Set value="..." on each non-parent checkbox.',
        );
        continue;
      }
      const val = cb.getAttribute('value')!;
      if (seen.has(val)) {
        console.warn(
          `[grund-checkbox-group] Duplicate checkbox value "${val}" detected. Values within a group must be unique.`,
        );
      } else {
        seen.add(val);
      }
    }

    const hasParent = checkboxes.some((cb) => cb.hasAttribute('parent'));
    if (hasParent && this.allValues.length === 0) {
      console.warn(
        '[grund-checkbox-group] A parent checkbox is present but allValues is empty. Set allValues="[...]" so the parent can derive its checked/indeterminate state.',
      );
    }
  }

  private _resolveReferencedElements(value: string): HTMLElement[] {
    return value
      .split(/\s+/)
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => this.ownerDocument?.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
  }

  protected override render() {
    return html`
      <div part="group" role="group" aria-label=${this.ariaLabel ?? nothing}>
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-checkbox-group')) {
  customElements.define('grund-checkbox-group', GrundCheckboxGroup);
}
