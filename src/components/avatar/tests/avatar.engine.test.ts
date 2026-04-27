import { describe, it, expect, vi } from 'vitest';

import { AvatarEngine } from '../avatar.engine';

describe('AvatarEngine', () => {
  it('starts in idle state', () => {
    const engine = new AvatarEngine();
    expect(engine.status).to.equal('idle');
  });

  it('transitions idle → loading → loaded', () => {
    const engine = new AvatarEngine();
    engine.setStatus('loading');
    expect(engine.status).to.equal('loading');
    engine.setStatus('loaded');
    expect(engine.status).to.equal('loaded');
  });

  it('transitions loading → error', () => {
    const engine = new AvatarEngine();
    engine.setStatus('loading');
    engine.setStatus('error');
    expect(engine.status).to.equal('error');
  });

  it('is a no-op when status is unchanged', () => {
    const engine = new AvatarEngine();
    const listener = vi.fn();
    engine.onChange(listener);
    engine.setStatus('idle');
    expect(listener).not.toHaveBeenCalled();
    expect(engine.status).to.equal('idle');
  });

  it('notifies listeners on actual transition', () => {
    const engine = new AvatarEngine();
    const listener = vi.fn();
    engine.onChange(listener);
    engine.setStatus('loading');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('loading');
  });

  it('supports unsubscribing a listener', () => {
    const engine = new AvatarEngine();
    const listener = vi.fn();
    const unsubscribe = engine.onChange(listener);
    unsubscribe();
    engine.setStatus('loading');
    expect(listener).not.toHaveBeenCalled();
  });
});
