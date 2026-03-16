import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { AriaLinkController } from './aria-link.controller';

interface MockHost extends ReactiveControllerHost {
  addController: ReturnType<typeof vi.fn>;
}

function getAriaControls(el: Element): Element[] | null {
  return (el as any).ariaControlsElements;
}

function getAriaLabelledBy(el: Element): Element[] | null {
  return (el as any).ariaLabelledByElements;
}

function createMockHost(): MockHost {
  return {
    addController: vi.fn(),
    requestUpdate: vi.fn(),
    removeController: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

describe('AriaLinkController', () => {
  let host: MockHost;
  const connected: Element[] = [];

  function attach<T extends Element>(el: T): T {
    document.body.appendChild(el);
    connected.push(el);
    return el;
  }

  afterEach(() => {
    connected.forEach((el) => el.parentNode?.removeChild(el));
    connected.length = 0;
  });

  beforeEach(() => {
    host = createMockHost();
  });

  it('registers itself with the host', () => {
    new AriaLinkController(host, {
      source: () => null,
      target: () => null,
      type: 'controls',
    });
    expect(host.addController).toHaveBeenCalledOnce();
  });

  it('sets ariaControlsElements when type is controls', () => {
    const source = attach(document.createElement('button'));
    const target = attach(document.createElement('div'));

    const ctrl = new AriaLinkController(host, {
      source: () => source,
      target: () => target,
      type: 'controls',
    });

    ctrl.hostUpdated();
    expect(getAriaControls(source)).toEqual([target]);
  });

  it('sets ariaLabelledByElements when type is labelledby', () => {
    const source = attach(document.createElement('div'));
    const target = attach(document.createElement('button'));

    const ctrl = new AriaLinkController(host, {
      source: () => source,
      target: () => target,
      type: 'labelledby',
    });

    ctrl.hostUpdated();
    expect(getAriaLabelledBy(source)).toEqual([target]);
  });

  it('no-ops when source is null', () => {
    const target = attach(document.createElement('div'));
    const ctrl = new AriaLinkController(host, {
      source: () => null,
      target: () => target,
      type: 'controls',
    });

    // Should not throw
    ctrl.hostUpdated();
  });

  it('no-ops when target is null', () => {
    const source = attach(document.createElement('button'));
    const ctrl = new AriaLinkController(host, {
      source: () => source,
      target: () => null,
      type: 'controls',
    });

    ctrl.hostUpdated();
    expect(getAriaControls(source) ?? null).toBeNull();
  });

  it('does not re-link when source and target are unchanged', () => {
    const source = attach(document.createElement('button'));
    const target = attach(document.createElement('div'));

    const ctrl = new AriaLinkController(host, {
      source: () => source,
      target: () => target,
      type: 'controls',
    });

    ctrl.hostUpdated();
    expect(getAriaControls(source)).toEqual([target]);

    const linkedSourceBefore = (ctrl as any).linkedSource;
    const linkedTargetBefore = (ctrl as any).linkedTarget;

    // Second call with same source and target — guard should skip the write
    ctrl.hostUpdated();
    expect((ctrl as any).linkedSource).toBe(linkedSourceBefore);
    expect((ctrl as any).linkedTarget).toBe(linkedTargetBefore);
    expect(getAriaControls(source)).toEqual([target]);
  });

  it('re-links when target changes', () => {
    const source = attach(document.createElement('button'));
    const target1 = attach(document.createElement('div'));
    const target2 = attach(document.createElement('div'));
    let currentTarget: Element | null = target1;

    const ctrl = new AriaLinkController(host, {
      source: () => source,
      target: () => currentTarget,
      type: 'controls',
    });

    ctrl.hostUpdated();
    expect(getAriaControls(source)).toEqual([target1]);

    currentTarget = target2;
    ctrl.hostUpdated();
    expect(getAriaControls(source)).toEqual([target2]);
  });

  it('clears the relationship when the target disappears', () => {
    const source = attach(document.createElement('button'));
    const target = attach(document.createElement('div'));
    let currentTarget: Element | null = target;

    const ctrl = new AriaLinkController(host, {
      source: () => source,
      target: () => currentTarget,
      type: 'controls',
    });

    ctrl.hostUpdated();
    expect(getAriaControls(source)).toEqual([target]);

    currentTarget = null;
    ctrl.hostUpdated();

    expect(getAriaControls(source)).toEqual([]);
    expect(source.hasAttribute('aria-controls')).toBe(false);
  });

  it('re-links when source changes', () => {
    const source1 = attach(document.createElement('button'));
    const source2 = attach(document.createElement('button'));
    const target = attach(document.createElement('div'));
    let currentSource: Element | null = source1;

    const ctrl = new AriaLinkController(host, {
      source: () => currentSource,
      target: () => target,
      type: 'controls',
    });

    ctrl.hostUpdated();
    expect(getAriaControls(source1)).toEqual([target]);

    currentSource = source2;
    ctrl.hostUpdated();
    expect(getAriaControls(source2)).toEqual([target]);
  });

  it('clears stored references on hostDisconnected', () => {
    const source = attach(document.createElement('button'));
    const target = attach(document.createElement('div'));

    const ctrl = new AriaLinkController(host, {
      source: () => source,
      target: () => target,
      type: 'controls',
    });

    ctrl.hostUpdated();
    ctrl.hostDisconnected();
    // After disconnect + reconnect, should re-link
    ctrl.hostUpdated();
    expect(getAriaControls(source)).toEqual([target]);
  });
});
