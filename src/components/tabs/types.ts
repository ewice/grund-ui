// src/components/tabs/types.ts — stub (will be expanded in Task 5)

export interface TabsHostSnapshot {
  value: string | null | undefined;
  defaultValue: string | null;
  disabled: boolean;
}

export interface TabsValueChangeDetail {
  value: string | null;
  previousValue: string | null;
}
