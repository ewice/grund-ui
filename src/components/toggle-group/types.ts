import type { OrderedRecord } from '../../utils/ordered-registry';

/** Detail for `grund-value-change` event on the root element. */
export interface ToggleGroupValueChangeDetail {
  value: string[];
}

/**
 * Snapshot of host properties passed to ToggleGroupEngine.syncFromHost().
 * @internal
 */
export interface ToggleGroupHostSnapshot {
  value: string[] | undefined;
  defaultValue: string[];
  multiple: boolean;
  disabled: boolean;
}

export interface ToggleGroupRecord extends OrderedRecord {
  value: string;
}