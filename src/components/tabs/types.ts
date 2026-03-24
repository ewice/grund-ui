/** Detail for `grund-value-change` event on the root element. */
export interface TabsValueChangeDetail {
  value: string | null;
  previousValue: string | null;
}

/** Snapshot of host properties passed to TabsController.syncFromHost(). */
export interface TabsHostSnapshot {
  value: string | null | undefined;
  defaultValue: string | null;
  disabled: boolean;
}
