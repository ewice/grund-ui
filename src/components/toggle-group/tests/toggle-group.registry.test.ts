import { expect, describe, it, beforeEach } from 'vitest';
import { ToggleGroupRegistry } from '../toggle-group.registry.js';

describe('ToggleGroupRegistry', () => {
  let registry: ToggleGroupRegistry;
  let a: HTMLElement;
  let b: HTMLElement;

  beforeEach(() => {
    registry = new ToggleGroupRegistry();
    a = document.createElement('div');
    b = document.createElement('div');
    document.body.append(a, b);
  });

  it('starts empty', () => {
    expect(registry.toggles).to.have.lengthOf(0);
  });

  it('registers a toggle', () => {
    registry.register(a, 'a');
    expect(registry.toggles).to.have.lengthOf(1);
    expect(registry.toggles[0].element).to.equal(a);
    expect(registry.toggles[0].value).to.equal('a');
  });

  it('unregisters a toggle', () => {
    registry.register(a, 'a');
    registry.unregister(a);
    expect(registry.toggles).to.have.lengthOf(0);
  });

  it('maintains DOM order', () => {
    registry.register(b, 'b');
    registry.register(a, 'a');
    expect(registry.toggles[0].element).to.equal(a);
    expect(registry.toggles[1].element).to.equal(b);
  });
});
