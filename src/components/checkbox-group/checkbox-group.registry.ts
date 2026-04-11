export interface CheckboxGroupRegistration {
  value: string;
  parent: boolean;
}

export class CheckboxGroupRegistry {
  private readonly records = new Map<HTMLElement, CheckboxGroupRegistration>();

  register(element: HTMLElement, record: CheckboxGroupRegistration): void {
    this.records.set(element, record);
  }

  get(element: HTMLElement): CheckboxGroupRegistration | undefined {
    return this.records.get(element);
  }

  unregister(element: HTMLElement): void {
    this.records.delete(element);
  }

  selectableValues(): string[] {
    return Array.from(this.records.values())
      .filter((record) => !record.parent)
      .map((record) => record.value);
  }

}
