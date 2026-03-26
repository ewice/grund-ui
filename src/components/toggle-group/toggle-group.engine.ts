import { SelectionEngine } from '../../controllers/selection.engine';

import type { ToggleGroupHostSnapshot } from './types';

export class ToggleGroupEngine {
  private readonly selection = new SelectionEngine();

  public syncFromHost(snapshot: ToggleGroupHostSnapshot): void {
    this.selection.syncFromHost({
      value: snapshot.value,
      defaultValue: snapshot.defaultValue,
      multiple: snapshot.multiple,
      disabled: snapshot.disabled,
    });
  }

  public requestToggle(value: string, toggleDisabled: boolean): string[] | null {
    return this.selection.requestToggle(value, toggleDisabled);
  }

  public isPressed(value: string): boolean {
    return this.selection.isSelected(value);
  }
}
