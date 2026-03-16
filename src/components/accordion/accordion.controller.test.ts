import { describe, it, expect, vi } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { AccordionController } from './accordion.controller';

function createMockHost() {
  return {
    addController: vi.fn(),
    requestUpdate: vi.fn(),
    removeController: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

describe('AccordionController', () => {
  it('initializes with no expanded items', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
      isDisabled: () => false,
    });
    expect(ctrl.expandedValues.size).toBe(0);
  });

  it('exposes expandedValues as a readonly set view', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
      isDisabled: () => false,
    });
    ctrl.toggle('item-1');
    const values = ctrl.expandedValues;
    expect(values.has('item-1')).toBe(true);
    expect(typeof (values as any).add).toBe('function');
  });

  describe('toggle (uncontrolled)', () => {
    it('expands an item in single mode', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        isDisabled: () => false,
      });

      const result = ctrl.toggle('item-1');

      expect(result).toEqual({ value: 'item-1', expanded: true });
      expect(ctrl.isExpanded('item-1')).toBe(true);
      expect(host.requestUpdate).toHaveBeenCalledOnce();
    });

    it('collapses the previous item in single mode', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        isDisabled: () => false,
      });

      ctrl.toggle('item-1');
      const result = ctrl.toggle('item-2');

      expect(result).toEqual({ value: 'item-2', expanded: true });
      expect(ctrl.isExpanded('item-1')).toBe(false);
      expect(ctrl.isExpanded('item-2')).toBe(true);
    });

    it('does not collapse when non-collapsible', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        collapsible: false,
        isDisabled: () => false,
      });

      ctrl.toggle('item-1');
      const result = ctrl.toggle('item-1');

      expect(result).toBeNull();
      expect(ctrl.isExpanded('item-1')).toBe(true);
    });

    it('collapses when collapsible is true', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        collapsible: true,
        isDisabled: () => false,
      });

      ctrl.toggle('item-1');
      const result = ctrl.toggle('item-1');

      expect(result).toEqual({ value: 'item-1', expanded: false });
      expect(ctrl.isExpanded('item-1')).toBe(false);
    });

    it('toggles independently in multiple mode', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        type: 'multiple',
        isDisabled: () => false,
      });

      ctrl.toggle('item-1');
      ctrl.toggle('item-2');

      expect(ctrl.isExpanded('item-1')).toBe(true);
      expect(ctrl.isExpanded('item-2')).toBe(true);
    });

    it('returns null for disabled items', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        isDisabled: (value) => value === 'item-1',
      });

      const result = ctrl.toggle('item-1');

      expect(result).toBeNull();
      expect(ctrl.isExpanded('item-1')).toBe(false);
    });
  });

  describe('previewToggle (controlled)', () => {
    it('returns a result without mutating state', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        isDisabled: () => false,
      });

      const result = ctrl.previewToggle('item-1');

      expect(result).toEqual({ value: 'item-1', expanded: true });
      expect(ctrl.isExpanded('item-1')).toBe(false);
    });

    it('returns null for disabled items', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        isDisabled: (value) => value === 'item-1',
      });

      expect(ctrl.previewToggle('item-1')).toBeNull();
    });

    it('previews collapse in collapsible mode', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        collapsible: true,
        isDisabled: () => false,
      });

      ctrl.setExpanded(new Set(['item-1']));
      const result = ctrl.previewToggle('item-1');

      expect(result).toEqual({ value: 'item-1', expanded: false });
      expect(ctrl.isExpanded('item-1')).toBe(true);
    });

    it('previews collapse for an expanded item in multiple mode', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        type: 'multiple',
        isDisabled: () => false,
      });

      ctrl.setExpanded(new Set(['item-1']));
      const result = ctrl.previewToggle('item-1');

      expect(result).toEqual({ value: 'item-1', expanded: false });
      expect(ctrl.isExpanded('item-1')).toBe(true);
    });
  });

  describe('setExpanded', () => {
    it('replaces the expanded set in multiple mode', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        type: 'multiple',
        isDisabled: () => false,
      });

      ctrl.setExpanded(new Set(['item-2', 'item-3']));

      expect(ctrl.isExpanded('item-2')).toBe(true);
      expect(ctrl.isExpanded('item-3')).toBe(true);
    });

    it('normalizes to one expanded item in single mode', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        isDisabled: () => false,
      });

      ctrl.setExpanded(new Set(['item-2', 'item-3']));

      expect(ctrl.isExpanded('item-2')).toBe(true);
      expect(ctrl.isExpanded('item-3')).toBe(false);
    });
  });

  describe('updateOptions', () => {
    it('updates type and collapsible at runtime', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        type: 'single',
        isDisabled: () => false,
      });

      ctrl.toggle('item-1');
      ctrl.updateOptions({ type: 'multiple' });
      ctrl.toggle('item-2');

      expect(ctrl.isExpanded('item-1')).toBe(true);
      expect(ctrl.isExpanded('item-2')).toBe(true);
    });

    it('updates collapsible at runtime', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        collapsible: false,
        isDisabled: () => false,
      });

      ctrl.toggle('item-1');
      expect(ctrl.toggle('item-1')).toBeNull();

      ctrl.updateOptions({ collapsible: true });
      const result = ctrl.toggle('item-1');

      expect(result).toEqual({ value: 'item-1', expanded: false });
    });

    it('reduces expanded items to one when switching back to single mode', () => {
      const host = createMockHost();
      const ctrl = new AccordionController(host as unknown as ReactiveControllerHost, {
        type: 'multiple',
        isDisabled: () => false,
      });

      ctrl.toggle('item-1');
      ctrl.toggle('item-2');
      ctrl.updateOptions({ type: 'single' });

      expect(ctrl.isExpanded('item-1')).toBe(true);
      expect(ctrl.isExpanded('item-2')).toBe(false);
    });
  });
});
