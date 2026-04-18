import type { CheckboxGroupRegistration } from './types';

export class CheckboxGroupRegistry {
  private readonly records = new Map<HTMLElement, CheckboxGroupRegistration>();

  public register(element: HTMLElement, record: CheckboxGroupRegistration): void {
    this.records.set(element, record);
  }

  public get(element: HTMLElement): CheckboxGroupRegistration | undefined {
    return this.records.get(element);
  }

  public unregister(element: HTMLElement): void {
    this.records.delete(element);
  }

  public selectableValues(): string[] {
    return Array.from(this.records.values())
      .filter((record) => !record.parent)
      .map((record) => record.value);
  }
}
