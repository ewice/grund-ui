import { ReactiveController } from 'lit';

export interface AccordionControllerHost {
  addController(controller: ReactiveController): void;
  requestUpdate(): void;
  dispatchEvent(event: Event): boolean;
}
