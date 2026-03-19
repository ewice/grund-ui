import type { GrundAccordionPanel } from '../panel/accordion-panel';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import type { GrundAccordionItemLike } from '../types';

export interface AccordionItemRecord {
  item: GrundAccordionItemLike;
  disabled: boolean;
  trigger: GrundAccordionTrigger | null;
  panel: GrundAccordionPanel | null;
}
