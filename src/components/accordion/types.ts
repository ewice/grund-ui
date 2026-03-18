/** Public type for accordion keyboard orientation. */
export type GrundAccordionOrientation = 'vertical' | 'horizontal';

/** Event detail for `grund-change`. */
export interface GrundAccordionChangeDetail {
  value: string;
  expanded: boolean;
}

/** Event detail for `grund-value-change`. */
export interface GrundAccordionValueChangeDetail {
  value: string[];
  itemValue: string;
  open: boolean;
}

/** Minimal item shape required by the accordion registry. */
export interface GrundAccordionItemLike extends Element {
  value: string;
  disabled?: boolean;
}

/** Readonly snapshot of derived item state shared across accordion layers. */
export interface GrundAccordionItemSnapshot {
  readonly value: string;
  readonly index: number;
  readonly disabled: boolean;
  readonly trigger: Element | null;
  readonly panel: Element | null;
}

/** Internal host snapshot used to sync accordion root controller state. */
export interface AccordionHostSnapshot {
  readonly multiple: boolean;
  readonly value?: string | string[];
  readonly defaultValue?: string | string[];
  readonly disabled: boolean;
  readonly orientation: GrundAccordionOrientation;
  readonly loopFocus: boolean;
  readonly keepMounted: boolean;
  readonly hiddenUntilFound: boolean;
}
