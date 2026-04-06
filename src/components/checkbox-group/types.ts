/** Detail for `grund-value-change` event on the checkbox group element. */
export interface CheckboxGroupValueChangeDetail {
  /** The new complete array of checked values. */
  value: string[];
  /** The checkbox value that triggered the change. */
  itemValue: string;
  /** The new checked state of the triggering checkbox. */
  checked: boolean;
}

/**
 * Snapshot of host properties passed to CheckboxGroupEngine.syncFromHost().
 * @internal
 */
export interface CheckboxGroupHostSnapshot {
  value: string[] | undefined;
  defaultValue: string[];
  disabled: boolean;
  allValues: string[];
}
