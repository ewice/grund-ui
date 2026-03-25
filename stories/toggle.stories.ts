import { html } from 'lit';
import { action } from 'storybook/actions';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundToggle } from '../src/components/toggle/index.js';
import type { PressedChangeDetail } from '../src/components/toggle/index.js';

import '../src/components/toggle/index.js';

const onPressedChange = (e: CustomEvent<PressedChangeDetail>) =>
  action('grund-pressed-change')(e.detail.pressed);

const meta: Meta<GrundToggle> = {
  title: 'Components/Toggle',
  component: 'grund-toggle',
  tags: ['autodocs'],
  argTypes: {
    pressed: { control: 'boolean' },
    defaultPressed: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<GrundToggle>;

export const Default: Story = {
  name: 'Default (uncontrolled)',
  args: {
    disabled: false,
    defaultPressed: false,
  },
  render: (args) => html`
    <grund-toggle
      ?disabled=${args.disabled}
      ?default-pressed=${args.defaultPressed}
      @grund-pressed-change=${onPressedChange}
    >
      Bold
    </grund-toggle>
  `,
};

export const DefaultPressed: Story = {
  name: 'Default pressed',
  render: () => html`
    <grund-toggle default-pressed @grund-pressed-change=${onPressedChange}> Italic </grund-toggle>
  `,
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => html`
    <div>
      <grund-toggle
        id="ctrl-toggle"
        .pressed=${false}
        @grund-pressed-change=${(e: CustomEvent<PressedChangeDetail>) => {
          action('grund-pressed-change')(e.detail);
          const el = document.getElementById('ctrl-toggle') as GrundToggle;
          if (el) el.pressed = e.detail.pressed;
          const status = document.getElementById('ctrl-status');
          if (status) status.textContent = `Pressed: ${e.detail.pressed}`;
        }}
        >Underline</grund-toggle
      >
      <p id="ctrl-status">Pressed: false</p>
    </div>
  `,
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => html`
    <div style="display: flex; gap: 8px;">
      <grund-toggle disabled>Disabled (unpressed)</grund-toggle>
      <grund-toggle disabled default-pressed>Disabled (pressed)</grund-toggle>
    </div>
  `,
};

export const RTL: Story = {
  name: 'RTL',
  render: () => html`
    <div dir="rtl">
      <grund-toggle @grund-pressed-change=${onPressedChange}>عريض</grund-toggle>
    </div>
  `,
};
