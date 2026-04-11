/** Detail for `grund-value-change` event on the checkbox group element. */
export interface CheckboxGroupValueChangeDetail {
  /** The new complete array of checked values after the change. */
  value: string[];
  /**
   * The value of the checkbox that triggered the change.
   * For parent toggle-all actions, this is the parent checkbox's `value` prop (e.g. `"all"`),
   * not one of the individual child values.
   */
  itemValue: string;
  /**
   * The new checked state of the triggering checkbox.
   * For parent toggle-all actions, `true` means all non-parent `<grund-checkbox>` children
   * in the group are now checked; `false` means all non-parent children are now unchecked.
   */
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
