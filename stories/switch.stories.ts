import { html } from 'lit';
import { action } from 'storybook/actions';
import { within, expect } from 'storybook/test';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundSwitch, CheckedChangeDetail } from '../src/components/switch';

import '../src/components/switch';

const onCheckedChange = (e: CustomEvent<CheckedChangeDetail>) =>
  action('grund-checked-change')(e.detail.checked);

const meta: Meta<GrundSwitch> = {
  title: 'Components/Switch',
  component: 'grund-switch',
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    value: { control: 'text' },
    name: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<GrundSwitch>;

export const Default: Story = {
  name: 'Default (uncontrolled)',
  render: () => html`
    <grund-switch @grund-checked-change=${onCheckedChange}>
      <grund-switch-thumb></grund-switch-thumb>
    </grund-switch>
  `,
};

export const WithThumb: Story = {
  name: 'With thumb',
  render: () => html`
    <style>
      grund-switch [part='input'] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      grund-switch {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      grund-switch-thumb {
        display: inline-block;
        width: 40px;
        height: 24px;
        border-radius: 12px;
        background: #ccc;
        position: relative;
        transition: background 150ms;
        cursor: pointer;
      }
      grund-switch-thumb[data-checked] {
        background: #333;
      }
      grund-switch-thumb[data-disabled] {
        opacity: 0.4;
        cursor: default;
      }
      grund-switch-thumb [part='thumb'] {
        display: block;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: transform 150ms;
      }
      grund-switch-thumb[data-checked] [part='thumb'] {
        transform: translateX(16px);
      }
    </style>
    <grund-switch @grund-checked-change=${onCheckedChange}>
      <grund-switch-thumb></grund-switch-thumb>
    </grund-switch>
  `,
};

export const WrappingLabel: Story = {
  name: 'Wrapping label',
  render: () => html`
    <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
      <grund-switch @grund-checked-change=${onCheckedChange}>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
      Notifications
    </label>
  `,
};

export const DefaultChecked: Story = {
  name: 'Default checked',
  render: () => html`
    <grund-switch default-checked @grund-checked-change=${onCheckedChange}>
      <grund-switch-thumb></grund-switch-thumb>
    </grund-switch>
  `,
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => html`
    <div>
      <grund-switch
        id="ctrl-switch"
        .checked=${false}
        @grund-checked-change=${(e: CustomEvent<CheckedChangeDetail>) => {
          action('grund-checked-change')(e.detail);
          const el = document.getElementById('ctrl-switch') as GrundSwitch;
          if (el) el.checked = e.detail.checked;
          const status = document.getElementById('ctrl-status');
          if (status) status.textContent = `Checked: ${e.detail.checked}`;
        }}
      >
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
      <p id="ctrl-status" style="margin: 8px 0 0; font-size: 12px; color: #666;">
        Checked: false
      </p>
    </div>
  `,
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <grund-switch disabled>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
      <grund-switch disabled default-checked>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
    </div>
  `,
};

export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <grund-switch read-only>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
      <grund-switch read-only default-checked>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
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
        <label style="display: inline-flex; align-items: center; gap: 8px;">
          <grund-switch name="terms" required>
            <grund-switch-thumb></grund-switch-thumb>
          </grund-switch>
          I agree to the terms
        </label>
        <button type="submit" style="padding: 6px 12px;">Submit</button>
      </div>
    </form>
  `,
};

export const ExternallyLabeled: Story = {
  name: 'Externally labeled (label for)',
  render: () => html`
    <div style="display: flex; align-items: center; gap: 8px;">
      <label for="ext-sw" style="cursor: pointer; font-size: 14px;">Enable dark mode</label>
      <grund-switch id="ext-sw" @grund-checked-change=${onCheckedChange}>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole('switch', { name: /enable dark mode/i }) as HTMLInputElement;
    expect(switchEl.checked).toBe(false);
  },
};

export const WithDescription: Story = {
  name: 'With description (aria-describedby)',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <label style="display: inline-flex; align-items: center; gap: 8px;">
        <grund-switch
          aria-describedby="sw-hint"
          @grund-checked-change=${onCheckedChange}
        >
          <grund-switch-thumb></grund-switch-thumb>
        </grund-switch>
        Enable notifications
      </label>
      <span id="sw-hint" style="font-size: 12px; color: #666;">
        You can unsubscribe at any time from your account settings.
      </span>
    </div>
  `,
};
