import { describe, expect, it } from 'vitest';
import { normalizeAccordionValues, resolveAccordionAction } from './engine';

describe('normalizeAccordionValues', () => {
  it('keeps only the first value in single mode', () => {
    expect(normalizeAccordionValues(['one', 'two'], { multiple: false })).toEqual(['one']);
  });

  it('keeps all values in multiple mode', () => {
    expect(normalizeAccordionValues(['one', 'two'], { multiple: true })).toEqual(['one', 'two']);
  });
});

describe('resolveAccordionAction', () => {
  it('opens a closed item in single mode', () => {
    expect(
      resolveAccordionAction({
        action: { type: 'toggle', value: 'one' },
        expandedValues: [],
        itemOrder: ['one', 'two'],
        disabledValues: new Set(),
        multiple: false,
      }),
    ).toMatchObject({
      changed: true,
      value: 'one',
      expanded: true,
      nextValues: ['one'],
    });
  });

  it('collapses an open item in single mode', () => {
    expect(
      resolveAccordionAction({
        action: { type: 'toggle', value: 'one' },
        expandedValues: ['one'],
        itemOrder: ['one', 'two'],
        disabledValues: new Set(),
        multiple: false,
      }),
    ).toMatchObject({
      changed: true,
      value: 'one',
      expanded: false,
      nextValues: [],
    });
  });

  it('toggles items independently in multiple mode', () => {
    expect(
      resolveAccordionAction({
        action: { type: 'toggle', value: 'two' },
        expandedValues: ['one'],
        itemOrder: ['one', 'two', 'three'],
        disabledValues: new Set(),
        multiple: true,
      }),
    ).toMatchObject({
      changed: true,
      value: 'two',
      expanded: true,
      nextValues: ['one', 'two'],
    });
  });

  it('ignores disabled items', () => {
    expect(
      resolveAccordionAction({
        action: { type: 'toggle', value: 'one' },
        expandedValues: ['one'],
        itemOrder: ['one', 'two'],
        disabledValues: new Set(['one']),
        multiple: false,
      }),
    ).toMatchObject({
      changed: false,
      value: 'one',
      nextValues: ['one'],
    });
  });

  it('does not reopen an already open item when open is requested', () => {
    expect(
      resolveAccordionAction({
        action: { type: 'open', value: 'one' },
        expandedValues: ['one'],
        itemOrder: ['one', 'two'],
        disabledValues: new Set(),
        multiple: false,
      }),
    ).toMatchObject({
      changed: false,
      value: 'one',
      expanded: true,
      nextValues: ['one'],
    });
  });

  it('orders next values by item order', () => {
    expect(
      resolveAccordionAction({
        action: { type: 'toggle', value: 'three' },
        expandedValues: ['two'],
        itemOrder: ['one', 'two', 'three'],
        disabledValues: new Set(),
        multiple: true,
      }),
    ).toMatchObject({
      changed: true,
      value: 'three',
      expanded: true,
      nextValues: ['two', 'three'],
    });
  });
});
