// src/components/tabs/types.ts

/**
 * Snapshot of host properties passed to TabsController.syncFromHost().
 * @internal
 */
export interface TabsHostSnapshot {
  value: string | null | undefined;
  defaultValue: string | null;
  disabled: boolean;
}

/**
 * Detail type for the `grund-value-change` event.
 */
export interface TabsValueChangeDetail {
  value: string | null;
  previousValue: string | null;
}
