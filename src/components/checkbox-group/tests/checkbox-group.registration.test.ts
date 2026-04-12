import { fixture, html } from '@open-wc/testing';
import { describe, expect, it, vi } from 'vitest';

import { flush } from '../../../test-utils/test-utils';
import {
  clickCheckbox,
  flushCheckboxes,
  flushCheckboxGroup,
  getCheckboxButton,
  setupCheckboxGroup,
} from './test-helpers';

import type { GrundCheckboxGroup } from '../checkbox-group';
import type { GrundCheckbox } from '../../checkbox';

describe('GrundCheckboxGroup registration and lifecycle', () => {
  describe('child registration', () => {
    it('derives parent state from registered non-parent checkboxes', async () => {
      const { checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group .defaultValue=${['a', 'b']}>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);

      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('true');
    });

    it('updates parent state when a child checkbox is added after mount', async () => {
      const el = await fixture<GrundCheckboxGroup>(html`
        <grund-checkbox-group .defaultValue=${['a']}>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);
      await flush(el);
      const initialCheckboxes = el.querySelectorAll<GrundCheckbox>('grund-checkbox');
      await flushCheckboxes(initialCheckboxes);

      const newCheckbox = document.createElement('grund-checkbox') as GrundCheckbox;
      (newCheckbox as any).value = 'b';
      newCheckbox.textContent = 'B';

      el.appendChild(newCheckbox);
      await flush(newCheckbox);
      await flushCheckboxGroup(el);

      const parentButton = getCheckboxButton(initialCheckboxes[0]);
      expect(parentButton.getAttribute('aria-checked')).to.equal('mixed');
    });
  });

  describe('memory and lifecycle', () => {
    it('removes the click listener on disconnect', async () => {
      const { el, checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);
      await flush(el);

      const removeSpy = vi.spyOn(checkboxes[0], 'removeEventListener');
      el.remove();

      expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
      removeSpy.mockRestore();
    });
  });

  describe('sibling-group isolation', () => {
    it('does not share state across sibling groups', async () => {
      const container = await fixture<HTMLDivElement>(html`
        <div>
          <grund-checkbox-group id="group-a">
            <grund-checkbox value="x">X</grund-checkbox>
          </grund-checkbox-group>
          <grund-checkbox-group id="group-b">
            <grund-checkbox value="x">X</grund-checkbox>
          </grund-checkbox-group>
        </div>
      `);

      const groupA = container.querySelector<GrundCheckboxGroup>('#group-a')!;
      const groupB = container.querySelector<GrundCheckboxGroup>('#group-b')!;
      const [checkboxA] = Array.from(groupA.querySelectorAll<GrundCheckbox>('grund-checkbox'));
      const [checkboxB] = Array.from(groupB.querySelectorAll<GrundCheckbox>('grund-checkbox'));
      await flush(groupA);
      await flush(groupB);
      await flush(checkboxA);
      await flush(checkboxB);

      const handlerB = vi.fn();
      groupB.addEventListener('grund-value-change', handlerB as EventListener);

      clickCheckbox(checkboxA);
      await flush(groupA);
      await flush(groupB);
      await flush(checkboxA);
      await flush(checkboxB);

      expect(getCheckboxButton(checkboxA).getAttribute('aria-checked')).to.equal('true');
      expect(getCheckboxButton(checkboxB).getAttribute('aria-checked')).to.equal('false');
      expect(handlerB).not.toHaveBeenCalled();
    });
  });

  describe('dynamic registration', () => {
    it('unregisters a child checkbox when it is removed from the DOM', async () => {
      const el = await fixture<GrundCheckboxGroup>(html`
        <grund-checkbox-group .defaultValue=${['a']}>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);
      await flush(el);
      const checkboxes = el.querySelectorAll<GrundCheckbox>('grund-checkbox');
      await flushCheckboxes(checkboxes);

      const parentButton = getCheckboxButton(checkboxes[0]);
      expect(parentButton.getAttribute('aria-checked')).to.equal('mixed');

      checkboxes[2].remove();
      await flush(el);
      await flushCheckboxes(el.querySelectorAll<GrundCheckbox>('grund-checkbox'));

      expect(parentButton.getAttribute('aria-checked')).to.equal('true');
    });

    it('resubscribes to a new group after reparenting', async () => {
      const container = await fixture<HTMLDivElement>(html`
        <div>
          <grund-checkbox-group id="group-a">
            <grund-checkbox value="x">X</grund-checkbox>
          </grund-checkbox-group>
          <grund-checkbox-group id="group-b">
            <grund-checkbox value="y">Y</grund-checkbox>
          </grund-checkbox-group>
        </div>
      `);

      const groupA = container.querySelector<GrundCheckboxGroup>('#group-a')!;
      const groupB = container.querySelector<GrundCheckboxGroup>('#group-b')!;
      const checkboxX = groupA.querySelector<GrundCheckbox>('grund-checkbox')!;
      await flush(groupA);
      await flush(groupB);
      await flush(checkboxX);

      groupB.appendChild(checkboxX);
      await flush(groupA);
      await flush(groupB);
      await flush(checkboxX);

      const handlerA = vi.fn();
      const handlerB = vi.fn();
      groupA.addEventListener('grund-value-change', handlerA as EventListener);
      groupB.addEventListener('grund-value-change', handlerB as EventListener);

      clickCheckbox(checkboxX);
      await flush(groupA);
      await flush(groupB);
      await flush(checkboxX);

      expect(handlerB).toHaveBeenCalledOnce();
      expect(handlerA).not.toHaveBeenCalled();
    });

    it('registers children appended after the group has mounted', async () => {
      const el = await fixture<GrundCheckboxGroup>(html`
        <grund-checkbox-group .defaultValue=${['a', 'b']}></grund-checkbox-group>
      `);
      await flush(el);

      const checkboxA = document.createElement('grund-checkbox') as GrundCheckbox;
      const checkboxB = document.createElement('grund-checkbox') as GrundCheckbox;
      const parentCheckbox = document.createElement('grund-checkbox') as GrundCheckbox;

      (checkboxA as any).value = 'a';
      checkboxA.textContent = 'A';
      (checkboxB as any).value = 'b';
      checkboxB.textContent = 'B';
      (parentCheckbox as any).parent = true;
      (parentCheckbox as any).value = 'all';
      parentCheckbox.textContent = 'All';

      el.appendChild(parentCheckbox);
      el.appendChild(checkboxA);
      el.appendChild(checkboxB);

      await flushCheckboxGroup(el);

      expect(getCheckboxButton(parentCheckbox).getAttribute('aria-checked')).to.equal('true');
    });
  });
});
