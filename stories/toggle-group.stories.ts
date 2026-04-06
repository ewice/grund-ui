import { html } from 'lit';
import { action } from 'storybook/actions';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundToggleGroup } from '../src/components/toggle-group';
import type { ToggleGroupValueChangeDetail } from '../src/components/toggle-group';

import '../src/components/toggle-group';
import '../src/components/toggle';

const onValueChange = (e: CustomEvent<ToggleGroupValueChangeDetail>) =>
  action('grund-value-change')(e.detail.value);

const meta: Meta<GrundToggleGroup> = {
  title: 'Components/ToggleGroup',
  component: 'grund-toggle-group',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
    loop: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<GrundToggleGroup>;

export const Default: Story = {
  name: 'Default (single, uncontrolled)',
  args: { label: 'Text formatting', multiple: false, disabled: false, orientation: 'horizontal', loop: true },
  render: (args) => html`
    <grund-toggle-group
      label=${args.label}
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      orientation=${args.orientation}
      ?loop=${args.loop}
      @grund-value-change=${onValueChange}
    >
      <grund-toggle value="bold">Bold</grund-toggle>
      <grund-toggle value="italic">Italic</grund-toggle>
      <grund-toggle value="underline">Underline</grund-toggle>
    </grund-toggle-group>
  `,
};

export const Multiple: Story = {
  name: 'Multiple selection',
  render: () => html`
    <grund-toggle-group multiple @grund-value-change=${onValueChange}>
      <grund-toggle value="bold">Bold</grund-toggle>
      <grund-toggle value="italic">Italic</grund-toggle>
      <grund-toggle value="underline">Underline</grund-toggle>
    </grund-toggle-group>
  `,
};

export const DefaultValue: Story = {
  name: 'Default value (uncontrolled)',
  render: () => html`
    <grund-toggle-group .defaultValue=${['italic']} @grund-value-change=${onValueChange}>
      <grund-toggle value="bold">Bold</grund-toggle>
      <grund-toggle value="italic">Italic</grund-toggle>
      <grund-toggle value="underline">Underline</grund-toggle>
    </grund-toggle-group>
  `,
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => html`
    <div>
      <grund-toggle-group
        id="ctrl-group"
        .value=${['bold']}
        @grund-value-change=${(e: CustomEvent<ToggleGroupValueChangeDetail>) => {
          action('grund-value-change')(e.detail.value);
          const el = document.getElementById('ctrl-group') as GrundToggleGroup;
          if (el) el.value = e.detail.value;
          const status = document.getElementById('ctrl-status');
          if (status) status.textContent = `Value: [${e.detail.value.join(', ')}]`;
        }}
      >
        <grund-toggle value="bold">Bold</grund-toggle>
        <grund-toggle value="italic">Italic</grund-toggle>
        <grund-toggle value="underline">Underline</grund-toggle>
      </grund-toggle-group>
      <p id="ctrl-status">Value: [bold]</p>
    </div>
  `,
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => html`
    <grund-toggle-group disabled .defaultValue=${['bold']}>
      <grund-toggle value="bold">Bold</grund-toggle>
      <grund-toggle value="italic">Italic</grund-toggle>
    </grund-toggle-group>
  `,
};

export const Vertical: Story = {
  name: 'Vertical orientation',
  render: () => html`
    <grund-toggle-group orientation="vertical" @grund-value-change=${onValueChange}>
      <grund-toggle value="top">Align Top</grund-toggle>
      <grund-toggle value="middle">Align Middle</grund-toggle>
      <grund-toggle value="bottom">Align Bottom</grund-toggle>
    </grund-toggle-group>
  `,
};
