import { fixture, html } from '@open-wc/testing';
import { flush, getByPart } from '../../../test-utils/test-utils';
import '../checkbox-group';
import '../../checkbox/checkbox';
import '../../checkbox/checkbox-indicator';

import type { GrundCheckboxGroup } from '../checkbox-group';
import type { GrundCheckbox } from '../../checkbox';

const defaultTemplate = html`
  <grund-checkbox-group>
    <grund-checkbox value="a">A</grund-checkbox>
    <grund-checkbox value="b">B</grund-checkbox>
    <grund-checkbox value="c">C</grund-checkbox>
  </grund-checkbox-group>
`;

export async function flushCheckboxes(checkboxes: Iterable<GrundCheckbox>): Promise<void> {
  for (const checkbox of checkboxes) {
    await flush(checkbox);
  }
}

export async function flushCheckboxGroup(el: GrundCheckboxGroup): Promise<GrundCheckbox[]> {
  await flush(el);
  const checkboxes = Array.from(el.querySelectorAll<GrundCheckbox>('grund-checkbox'));
  await flushCheckboxes(checkboxes);
  return checkboxes;
}

export async function setupCheckboxGroup(template = defaultTemplate) {
  const el = await fixture<GrundCheckboxGroup>(template);
  const checkboxes = await flushCheckboxGroup(el);
  return { el, checkboxes };
}

export function getCheckboxButton(checkbox: GrundCheckbox): HTMLButtonElement {
  return getByPart<HTMLButtonElement>(checkbox, 'button');
}

export function clickCheckbox(checkbox: GrundCheckbox): void {
  getCheckboxButton(checkbox).click();
}
