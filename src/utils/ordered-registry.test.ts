import { expect, describe, it, afterEach } from 'vitest';
import { OrderedRegistry } from './ordered-registry.js';

interface TestRecord { element: HTMLElement; label: string }

describe('OrderedRegistry', () => {
  function makeEl(id: string): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }
  afterEach(() => {
    document.body.querySelectorAll('div[id]').forEach((el) => el.remove());
  });

  it('insert maintains DOM order', () => {
    const reg = new OrderedRegistry<TestRecord>();
    const a = makeEl('a');
    const b = makeEl('b');
    reg.insert({ element: b, label: 'B' });
    reg.insert({ element: a, label: 'A' });
    expect(reg.entries[0].label).to.equal('A');
    expect(reg.entries[1].label).to.equal('B');
  });

  it('remove by predicate', () => {
    const reg = new OrderedRegistry<TestRecord>();
    const a = makeEl('a');
    reg.insert({ element: a, label: 'A' });
    reg.remove((r) => r.label === 'A');
    expect(reg.entries).to.have.length(0);
  });

  it('find by predicate', () => {
    const reg = new OrderedRegistry<TestRecord>();
    const a = makeEl('a');
    reg.insert({ element: a, label: 'A' });
    expect(reg.find((r) => r.label === 'A')?.element).to.equal(a);
  });

  it('findIndex by predicate', () => {
    const reg = new OrderedRegistry<TestRecord>();
    const a = makeEl('a');
    const b = makeEl('b');
    reg.insert({ element: a, label: 'A' });
    reg.insert({ element: b, label: 'B' });
    expect(reg.findIndex((r) => r.label === 'B')).to.equal(1);
  });

  it('findIndex returns -1 when not found', () => {
    const reg = new OrderedRegistry<TestRecord>();
    expect(reg.findIndex((r) => r.label === 'X')).to.equal(-1);
  });

  it('entries is readonly', () => {
    const reg = new OrderedRegistry<TestRecord>();
    expect(Array.isArray(reg.entries)).to.be.true;
  });
});
