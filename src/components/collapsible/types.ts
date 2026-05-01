export type CollapsibleOpenChangeReason = 'trigger-press' | 'programmatic';

export interface CollapsibleOpenChangeDetail {
  open: boolean;
  reason: CollapsibleOpenChangeReason;
  trigger: HTMLElement | null;
}

export interface CollapsibleHostSnapshot {
  open: boolean | undefined;
  defaultOpen: boolean;
  disabled: boolean;
}
