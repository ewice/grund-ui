import { html } from 'lit';
import { action } from 'storybook/actions';
import { within, userEvent, expect } from '@storybook/test';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundCheckbox } from '../src/components/checkbox/index.js';
import type { CheckedChangeDetail } from '../src/components/checkbox/index.js';

import '../src/components/checkbox/index.js';

const onCheckedChange = (e: CustomEvent<CheckedChangeDetail>) =>
  action('grund-checked-change')(e.detail.checked);

const indicatorStyle = `
  grund-checkbox-indicator[data-unchecked] { display: none; }
`;

const meta: Meta<GrundCheckbox> = {
  title: 'Components/Checkbox',
  component: 'grund-checkbox',
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    name: { control: 'text' },
    value: { control: 'text' },
  },
  decorators: [(story) => html`<style>${indicatorStyle}</style>${story()}`],
};
export default meta;
type Story = StoryObj<GrundCheckbox>;

export const Default: Story = {
  name: 'Default (uncontrolled)',
  args: {
    disabled: false,
    defaultChecked: false,
  },
  render: (args) => html`
    <grund-checkbox
      ?disabled=${args.disabled}
      ?default-checked=${args.defaultChecked}
      @grund-checked-change=${onCheckedChange}
    >
      <grund-checkbox-indicator>✓</grund-checkbox-indicator>
      Accept terms
    </grund-checkbox>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: /accept terms/i });

    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    // Keyboard: Space toggles
    checkbox.focus();
    await userEvent.keyboard(' ');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  },
};

export const DefaultChecked: Story = {
  name: 'Default checked',
  render: () => html`
    <grund-checkbox default-checked @grund-checked-change=${onCheckedChange}>
      <grund-checkbox-indicator>✓</grund-checkbox-indicator>
      Subscribe to newsletter
    </grund-checkbox>
  `,
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => html`
    <div>
      <grund-checkbox
        id="ctrl-checkbox"
        .checked=${false}
        @grund-checked-change=${(e: CustomEvent<CheckedChangeDetail>) => {
          action('grund-checked-change')(e.detail);
          const el = document.getElementById('ctrl-checkbox') as GrundCheckbox;
          if (el) el.checked = e.detail.checked;
          const status = document.getElementById('ctrl-status');
          if (status) status.textContent = `Checked: ${e.detail.checked}`;
        }}
      >
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        I agree
      </grund-checkbox>
      <p id="ctrl-status">Checked: false</p>
    </div>
  `,
};

export const Indeterminate: Story = {
  name: 'Indeterminate',
  render: () => html`
    <grund-checkbox
      .indeterminate=${true}
      @grund-checked-change=${onCheckedChange}
    >
      <grund-checkbox-indicator>—</grund-checkbox-indicator>
      Select all
    </grund-checkbox>
  `,
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => html`
    <div style="display: flex; gap: 8px;">
      <grund-checkbox disabled>
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        Disabled (unchecked)
      </grund-checkbox>
      <grund-checkbox disabled default-checked>
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        Disabled (checked)
      </grund-checkbox>
    </div>
  `,
};

export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => html`
    <grund-checkbox read-only default-checked @grund-checked-change=${onCheckedChange}>
      <grund-checkbox-indicator>✓</grund-checkbox-indicator>
      Read-only (checked)
    </grund-checkbox>
  `,
};

export const InForm: Story = {
  name: 'In a form',
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        action('form-submit')(Object.fromEntries(data));
      }}
    >
      <grund-checkbox name="newsletter" value="yes" required>
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        Subscribe to newsletter
      </grund-checkbox>
      <br />
      <button type="submit" style="margin-top: 8px;">Submit</button>
      <button type="reset" style="margin-top: 8px;">Reset</button>
    </form>
  `,
};

export const RTL: Story = {
  name: 'RTL',
  render: () => html`
    <div dir="rtl">
      <grund-checkbox @grund-checked-change=${onCheckedChange}>
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        قبول الشروط
      </grund-checkbox>
    </div>
  `,
};
