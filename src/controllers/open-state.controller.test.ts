import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { OpenStateController } from './open-state.controller';

interface MockHost extends ReactiveControllerHost, HTMLElement {
  addController: ReturnType<typeof vi.fn>;
}

function createMockHost(): MockHost {
  const el = document.createElement('div') as unknown as MockHost;
  el.addController = vi.fn();
  (el as any).requestUpdate = vi.fn();
  (el as any).removeController = vi.fn();
  (el as any).updateComplete = Promise.resolve(true);
  return el;
}

describe('OpenStateController', () => {
  let host: MockHost;

  beforeEach(() => {
    host = createMockHost();
  });

  it('registers itself with the host', () => {
    new OpenStateController(host, { isOpen: () => false });
    expect(host.addController).toHaveBeenCalledOnce();
  });

  it('sets data-state="open" when isOpen returns true', () => {
    const ctrl = new OpenStateController(host, { isOpen: () => true });
    ctrl.hostUpdated();
    expect(host.dataset.state).toBe('open');
  });

  it('sets data-state="closed" when isOpen returns false', () => {
    const ctrl = new OpenStateController(host, { isOpen: () => false });
    ctrl.hostUpdated();
    expect(host.dataset.state).toBe('closed');
  });

  it('updates data-state when isOpen result changes', () => {
    let open = false;
    const ctrl = new OpenStateController(host, { isOpen: () => open });

    ctrl.hostUpdated();
    expect(host.dataset.state).toBe('closed');

    open = true;
    ctrl.hostUpdated();
    expect(host.dataset.state).toBe('open');
  });

  it('removes data-state on hostDisconnected', () => {
    const ctrl = new OpenStateController(host, { isOpen: () => true });
    ctrl.hostUpdated();
    expect(host.dataset.state).toBe('open');
    ctrl.hostDisconnected();
    expect(host.dataset.state).toBeUndefined();
  });
});
