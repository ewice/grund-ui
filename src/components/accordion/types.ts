/** Detail for `grund-value-change` event on the root element. */
export interface AccordionValueChangeDetail {
  value: string[];
  itemValue: string;
  open: boolean;
}

/** Detail for `grund-open-change` event on an item element. */
export interface AccordionOpenChangeDetail {
  open: boolean;
  value: string;
  index: number;
}

/**
 * Snapshot of host properties passed to AccordionEngine.syncFromHost().
 * @internal
 */
export interface AccordionHostSnapshot {
  value: string[] | undefined;
  defaultValue: string[] | undefined;
  multiple: boolean;
  disabled: boolean;
}
