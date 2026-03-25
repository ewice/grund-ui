import { html } from 'lit';
import { action } from 'storybook/actions';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundAccordion } from '../src/components/accordion/index.js';

import '../src/components/accordion/index.js';

const meta: Meta<GrundAccordion> = {
  title: 'Components/Accordion',
  component: 'grund-accordion',
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    loopFocus: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<GrundAccordion>;

export const Default: Story = {
  render: (args) => html`
    <grund-accordion
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      orientation=${args.orientation ?? 'vertical'}
      ?loop-focus=${args.loopFocus ?? true}
      @grund-value-change=${action('grund-value-change')}
      @grund-open-change=${action('grund-open-change')}
    >
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>What is Grund UI?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <p>A headless, accessible Web Component library built with Lit.</p>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2">
        <grund-accordion-header>
          <grund-accordion-trigger>Is it accessible?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <p>Yes. It follows WAI-ARIA APG patterns with full keyboard support.</p>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-3">
        <grund-accordion-header>
          <grund-accordion-trigger>Can I style it?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <p>Absolutely. Use ::part() selectors and data-* attributes for full control.</p>
        </grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const WithDefaultOpen: Story = {
  render: () => html`
    <grund-accordion
      .defaultValue=${['item-2']}
      @grund-value-change=${action('grund-value-change')}
      @grund-open-change=${action('grund-open-change')}
    >
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>Section 1</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content 1</p></grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2">
        <grund-accordion-header>
          <grund-accordion-trigger>Section 2 (default open)</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content 2</p></grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const Multiple: Story = {
  render: () => html`
    <grund-accordion
      multiple
      .defaultValue=${['a', 'b']}
      @grund-value-change=${action('grund-value-change')}
      @grund-open-change=${action('grund-open-change')}
    >
      <grund-accordion-item value="a">
        <grund-accordion-header>
          <grund-accordion-trigger>Section A</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content A</p></grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="b">
        <grund-accordion-header>
          <grund-accordion-trigger>Section B</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content B</p></grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="c">
        <grund-accordion-header>
          <grund-accordion-trigger>Section C</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content C</p></grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const Disabled: Story = {
  render: () => html`
    <grund-accordion disabled>
      <grund-accordion-item value="a">
        <grund-accordion-header>
          <grund-accordion-trigger>Disabled Section</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Cannot be opened</p></grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const ItemDisabled: Story = {
  render: () => html`
    <grund-accordion
      @grund-value-change=${action('grund-value-change')}
      @grund-open-change=${action('grund-open-change')}
    >
      <grund-accordion-item value="a">
        <grund-accordion-header>
          <grund-accordion-trigger>Enabled</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>This works</p></grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="b" disabled>
        <grund-accordion-header>
          <grund-accordion-trigger>Disabled Item</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Cannot be opened</p></grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};
