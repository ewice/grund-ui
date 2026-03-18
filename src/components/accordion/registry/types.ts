import { GrundAccordionItemLike } from '../types';

export interface AccordionItemRecord {
  item: GrundAccordionItemLike;
  value: string;
  disabled: boolean;
  trigger: Element | null;
  panel: Element | null;
}
