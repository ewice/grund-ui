import { describe, expect, it, vi } from 'vitest';
import {
  accordionContext,
  accordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from '.';

describe('accordion context barrel', () => {
  it('exports the root and item contexts', () => {
    expect(accordionContext).toBeTruthy();
    expect(accordionItemContext).toBeTruthy();
  });

  it('keeps the descendant-facing root context aliases in the contract', () => {
    const noop = vi.fn();
    const rootContext: AccordionContextValue = {
      orientation: 'vertical',
      loopFocus: true,
      disabled: false,
      keepMounted: false,
      hiddenUntilFound: false,
      expandedItems: new Set(),
      requestToggle: noop,
      requestOpen: noop,
      registerItem: noop,
      unregisterItem: noop,
      renameExpandedValue: noop,
      attachTrigger: noop,
      detachTrigger: noop,
      attachPanel: noop,
      detachPanel: noop,
      getItemState: () => undefined,
      getItemIndex: () => -1,
      toggle: noop,
      openItem: noop,
    };

    expect(rootContext.toggle).toBe(noop);
    expect(rootContext.openItem).toBe(noop);
  });

  it('keeps the item context contract intact for descendants', () => {
    const noop = vi.fn();
    const itemContext: AccordionItemContextValue = {
      value: 'item-1',
      index: 0,
      disabled: false,
      expanded: false,
      orientation: 'vertical',
      keepMounted: false,
      hiddenUntilFound: false,
      open: noop,
      registerTrigger: noop,
      unregisterTrigger: noop,
      registerPanel: noop,
      unregisterPanel: noop,
      registeredTrigger: null,
      registeredPanel: null,
    };

    expect(itemContext.index).toBe(0);
    expect(itemContext.open).toBe(noop);
  });
});
