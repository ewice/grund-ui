export interface CheckboxGroupValueChangeDetail {
  value: string[];
  itemValue: string;
  checked: boolean;
}

export interface CheckboxGroupHostSnapshot {
  value: string[] | undefined;
  defaultValue: string[];
  disabled: boolean;
  selectableValues: string[];
}
