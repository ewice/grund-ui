import { expect, describe, it } from 'vitest';
import { CheckboxGroupRegistry } from '../checkbox-group.registry.js';

describe('CheckboxGroupRegistry', () => {
  it('registers and unregisters checkbox records by element', () => {
    const registry = new CheckboxGroupRegistry();
    const el = document.createElement('grund-checkbox');

    registry.register(el, { value: 'a', parent: false });
    registry.unregister(el);

    expect(registry.selectableValues()).to.deep.equal([]);
  });

  it('returns selectable values excluding parent/select-all records', () => {
    const registry = new CheckboxGroupRegistry();
    const parentEl = document.createElement('grund-checkbox');
    const elA = document.createElement('grund-checkbox');
    const elB = document.createElement('grund-checkbox');

    registry.register(parentEl, { value: 'all', parent: true });
    registry.register(elA, { value: 'a', parent: false });
    registry.register(elB, { value: 'b', parent: false });

    // values() => ['a', 'b'], not ['all', 'a', 'b']
    expect(registry.selectableValues()).to.deep.equal(['a', 'b']);
  });

  it('returns an empty array when no non-parent records exist', () => {
    const registry = new CheckboxGroupRegistry();
    expect(registry.selectableValues()).to.deep.equal([]);
  });

  it('updates selectable values when a record is re-registered with a new value', () => {
    const registry = new CheckboxGroupRegistry();
    const el = document.createElement('grund-checkbox');

    registry.register(el, { value: 'a', parent: false });
    registry.register(el, { value: 'b', parent: false });

    expect(registry.selectableValues()).to.deep.equal(['b']);
  });
});
