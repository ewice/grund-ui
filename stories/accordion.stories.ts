import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import '../src/components/accordion/index.js';

type AccordionStoryArgs = {
  multiple: boolean;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  loopFocus: boolean;
  keepMounted: boolean;
  hiddenUntilFound: boolean;
};

const meta: Meta<AccordionStoryArgs> = {
  title: 'Components/Accordion',
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    loopFocus: { control: 'boolean' },
    keepMounted: { control: 'boolean' },
    hiddenUntilFound: { control: 'boolean' },
  },
  args: {
    multiple: false,
    disabled: false,
    orientation: 'vertical',
    loopFocus: true,
    keepMounted: false,
    hiddenUntilFound: false,
  },
};

export default meta;

type Story = StoryObj<AccordionStoryArgs>;

function renderAccordion(args: AccordionStoryArgs, defaultValue?: string | string[]) {
  return html`
    <grund-accordion
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      orientation=${args.orientation}
      ?loop-focus=${args.loopFocus}
      ?keep-mounted=${args.keepMounted}
      ?hidden-until-found=${args.hiddenUntilFound}
      .defaultValue=${defaultValue}
    >
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
          <div style="padding: 12px;">Install the package and import the components you need.</div>
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
  `;
}

export const Default: Story = {
  render: (args) => renderAccordion(args),
};

export const Multiple: Story = {
  args: { multiple: true },
  render: (args) => renderAccordion(args),
};

export const WithDefaultValue: Story = {
  render: (args) => renderAccordion(args, 'item-2'),
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
