import { html } from 'lit';
import { action } from 'storybook/actions';
import { within, userEvent, expect } from 'storybook/test';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundCheckbox, CheckedChangeDetail } from '../src/components/checkbox';

import '../src/components/checkbox';

const onCheckedChange = (e: CustomEvent<CheckedChangeDetail>) =>
  action('grund-checked-change')(e.detail.checked);

const meta: Meta<GrundCheckbox> = {
  title: 'Components/Checkbox',
  component: 'grund-checkbox',
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    value: { control: 'text' },
    name: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<GrundCheckbox>;

export const Default: Story = {
  name: 'Default (uncontrolled)',
  render: () => html`
    <grund-checkbox @grund-checked-change=${onCheckedChange}>
      Accept terms
    </grund-checkbox>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('checkbox', { name: /accept terms/i });
    expect(button).toHaveAttribute('aria-checked', 'false');

    // Tab to focus, then Space to toggle
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-checked', 'true');

    // Space again to toggle back
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-checked', 'false');
  },
};

export const WithIndicator: Story = {
  name: 'With indicator',
  render: () => html`
    <style>
      grund-checkbox [part='button'] {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 14px;
        padding: 4px;
      }
      grund-checkbox-indicator {
        display: inline-flex;
        width: 16px;
        height: 16px;
        border: 2px solid #555;
        border-radius: 3px;
        align-items: center;
        justify-content: center;
      }
      grund-checkbox-indicator[data-checked] {
        background: #333;
        border-color: #333;
        color: #fff;
      }
      grund-checkbox-indicator[data-indeterminate] {
        background: #333;
        border-color: #333;
        color: #fff;
      }
      grund-checkbox-indicator[data-unchecked] svg {
        display: none;
      }
    </style>
    <grund-checkbox @grund-checked-change=${onCheckedChange}>
      <grund-checkbox-indicator>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </grund-checkbox-indicator>
      Subscribe to newsletter
    </grund-checkbox>
  `,
};

export const SlotComposition: Story = {
  name: 'Slot composition — indicator + label',
  render: () => html`
    <style>
      .combo {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      grund-checkbox[data-checked] .box { background: #333; border-color: #333; }
      grund-checkbox[data-checked] .check { display: block; }
      .box {
        display: inline-flex;
        width: 16px;
        height: 16px;
        border: 2px solid #555;
        border-radius: 3px;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .check { display: none; color: #fff; font-size: 10px; line-height: 1; }
    </style>
    <p style="font-size: 12px; margin: 0 0 12px; color: #666;">
      Slot the indicator and a visible label span together inside
      <code>&lt;grund-checkbox&gt;</code>. The host's <code>data-checked</code>
      attribute drives visibility via CSS — no JS needed.
    </p>
    <grund-checkbox class="combo" @grund-checked-change=${onCheckedChange}>
      <span class="box">
        <span class="check" aria-hidden="true">✓</span>
      </span>
      <span>I accept the privacy policy</span>
    </grund-checkbox>
  `,
};

export const DefaultChecked: Story = {
  name: 'Default checked',
  render: () => html`
    <grund-checkbox default-checked @grund-checked-change=${onCheckedChange}>
      Pre-selected option
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
        Controlled checkbox
      </grund-checkbox>
      <p id="ctrl-status" style="margin: 8px 0 0; font-size: 12px; color: #666;">
        Checked: false
      </p>
    </div>
  `,
};

export const Indeterminate: Story = {
  name: 'Indeterminate (tri-state)',
  render: () => html`
    <div>
      <p style="font-size: 12px; margin: 0 0 8px; color: #666;">
        Clicking the indeterminate checkbox fires checked:true; consumer clears indeterminate.
      </p>
      <grund-checkbox
        id="indet-checkbox"
        .indeterminate=${true}
        @grund-checked-change=${(e: CustomEvent<CheckedChangeDetail>) => {
          action('grund-checked-change')(e.detail);
          const el = document.getElementById('indet-checkbox') as GrundCheckbox;
          if (el) {
            el.indeterminate = false;
            el.checked = e.detail.checked;
          }
        }}
      >
        Select all
      </grund-checkbox>
    </div>
  `,
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <grund-checkbox disabled>Disabled (unchecked)</grund-checkbox>
      <grund-checkbox disabled default-checked>Disabled (checked)</grund-checkbox>
    </div>
  `,
};

export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <grund-checkbox read-only>Read-only (unchecked)</grund-checkbox>
      <grund-checkbox read-only default-checked>Read-only (checked)</grund-checkbox>
    </div>
  `,
};

export const Required: Story = {
  name: 'Required (form validation)',
  render: () => html`
    <form
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        action('form-submit')('submitted');
      }}
    >
      <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
        <grund-checkbox name="terms" required>
          I agree to the terms and conditions
        </grund-checkbox>
        <button type="submit" style="padding: 6px 12px;">Submit</button>
      </div>
    </form>
  `,
};

export const RTL: Story = {
  name: 'RTL',
  render: () => html`
    <div dir="rtl">
      <grund-checkbox @grund-checked-change=${onCheckedChange}>
        قبول الشروط والأحكام
      </grund-checkbox>
    </div>
  `,
};
