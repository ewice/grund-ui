import { expect, describe, it } from 'vitest';
import { CollapsibleEngine } from '../collapsible.engine';

import type { CollapsibleHostSnapshot } from '../types';

describe('CollapsibleEngine', () => {
  function create(snapshot?: Partial<CollapsibleHostSnapshot>) {
    const engine = new CollapsibleEngine();
    engine.syncFromHost({
      open: undefined,
      defaultOpen: false,
      disabled: false,
      ...snapshot,
    });
    return engine;
  }

  describe('uncontrolled mode', () => {
    it('starts closed by default', () => {
      const engine = create();
      expect(engine.isOpen).to.be.false;
    });

    it('starts open when defaultOpen is true', () => {
      const engine = create({ defaultOpen: true });
      expect(engine.isOpen).to.be.true;
    });

    it('seeds defaultOpen only once — re-sync with different defaultOpen is ignored', () => {
      const engine = create({ defaultOpen: true });
      engine.syncFromHost({ open: undefined, defaultOpen: false, disabled: false });
      expect(engine.isOpen).to.be.true;
    });

    it('requestToggle opens when closed', () => {
      const engine = create();
      const result = engine.requestToggle();
      expect(result).to.be.true;
      expect(engine.isOpen).to.be.true;
    });

    it('requestToggle closes when open', () => {
      const engine = create({ defaultOpen: true });
      const result = engine.requestToggle();
      expect(result).to.be.false;
      expect(engine.isOpen).to.be.false;
    });

    it('requestOpen opens idempotently', () => {
      const engine = create();
      expect(engine.requestOpen()).to.be.true;
      expect(engine.requestOpen()).to.be.true;
      expect(engine.isOpen).to.be.true;
    });

    it('requestClose closes idempotently', () => {
      const engine = create({ defaultOpen: true });
      expect(engine.requestClose()).to.be.false;
      expect(engine.requestClose()).to.be.false;
      expect(engine.isOpen).to.be.false;
    });
  });

  describe('controlled mode', () => {
    it('reflects externally set open state', () => {
      const engine = create({ open: true });
      expect(engine.isOpen).to.be.true;
    });

    it('does not mutate internal state on requestToggle', () => {
      const engine = create({ open: false });
      const result = engine.requestToggle();
      expect(result).to.be.true;
      expect(engine.isOpen).to.be.false;
    });

    it('updates when controlled value changes', () => {
      const engine = create({ open: false });
      engine.syncFromHost({ open: true, defaultOpen: false, disabled: false });
      expect(engine.isOpen).to.be.true;
    });

    it('requestOpen returns the requested state without mutating controlled state', () => {
      const engine = create({ open: false });
      const result = engine.requestOpen();
      expect(result).to.be.true;
      expect(engine.isOpen).to.be.false;
    });
  });

  describe('disabled', () => {
    it('blocks toggle when disabled', () => {
      const engine = create({ disabled: true });
      const result = engine.requestToggle();
      expect(result).to.be.null;
      expect(engine.isOpen).to.be.false;
    });

    it('blocks toggle when disabled and open', () => {
      const engine = create({ defaultOpen: true, disabled: true });
      const result = engine.requestToggle();
      expect(result).to.be.null;
      expect(engine.isOpen).to.be.true;
    });

    it('allows explicit programmatic open requests to bypass disabled', () => {
      const engine = create({ disabled: true });
      const result = engine.requestOpen({ ignoreDisabled: true });
      expect(result).to.be.true;
      expect(engine.isOpen).to.be.true;
    });
  });
});
