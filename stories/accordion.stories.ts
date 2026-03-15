import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '../src/components/accordion/index.js';



const meta: Meta = {
  title: 'Components/Accordion',
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
    },
    collapsible: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    type: 'single',
    collapsible: false,
    disabled: false,
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (args) => html`
    <grund-accordion type=${args.type} ?collapsible=${args.collapsible} ?disabled=${args.disabled}>
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>What is Grund UI?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">
            Grund UI is a headless, accessible Web Component library built with Lit.
          </div>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2">
        <grund-accordion-header>
          <grund-accordion-trigger>How do I get started?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">
            Install the package and import the components you need.
          </div>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-3">
        <grund-accordion-header>
          <grund-accordion-trigger>Can I use it for my project?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">Of course! Grund UI is free and open source.</div>
        </grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const Multiple: Story = {
  args: { type: 'multiple' },
  render: Default.render,
};

export const Collapsible: Story = {
  args: { collapsible: true },
  render: Default.render,
};

export const WithDisabledItem: Story = {
  render: () => html`
    <grund-accordion>
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>Enabled item</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">This item works normally.</div>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2" disabled>
        <grund-accordion-header>
          <grund-accordion-trigger>Disabled item</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">This item cannot be opened.</div>
        </grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};
