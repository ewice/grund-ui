import { html } from 'lit';
import { action } from 'storybook/actions';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundCollapsible } from '../src/components/collapsible';

import '../src/components/collapsible';

const meta: Meta<GrundCollapsible> = {
  title: 'Components/Collapsible',
  component: 'grund-collapsible',
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<GrundCollapsible>;

export const Default: Story = {
  render: (args) => html`
    <grund-collapsible
      ?disabled=${args.disabled}
      ?default-open=${args.defaultOpen}
      @grund-open-change=${action('grund-open-change')}
    >
      <grund-collapsible-trigger>Toggle content</grund-collapsible-trigger>
      <grund-collapsible-panel>
        <p>This is the collapsible content panel.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const DefaultOpen: Story = {
  render: () => html`
    <grund-collapsible default-open @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Toggle content</grund-collapsible-trigger>
      <grund-collapsible-panel>
        <p>This panel starts open.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const Controlled: Story = {
  render: () => {
    const handleChange = (e: CustomEvent) => {
      const target = e.currentTarget as GrundCollapsible;
      target.open = e.detail.open;
      action('grund-open-change')(e);
    };
    return html`
      <grund-collapsible .open=${false} @grund-open-change=${handleChange}>
        <grund-collapsible-trigger>Controlled toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>
          <p>Controlled panel — consumer manages open state.</p>
        </grund-collapsible-panel>
      </grund-collapsible>
    `;
  },
};

export const Disabled: Story = {
  render: () => html`
    <grund-collapsible disabled>
      <grund-collapsible-trigger>Cannot toggle (disabled)</grund-collapsible-trigger>
      <grund-collapsible-panel>
        <p>This panel cannot be opened.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const KeepMounted: Story = {
  render: () => html`
    <grund-collapsible @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Toggle (keep mounted)</grund-collapsible-trigger>
      <grund-collapsible-panel keep-mounted>
        <p>Panel stays in DOM when closed (hidden attribute applied).</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const HiddenUntilFound: Story = {
  render: () => html`
    <grund-collapsible @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Toggle (hidden until found)</grund-collapsible-trigger>
      <grund-collapsible-panel hidden-until-found>
        <p>This content is searchable via Ctrl+F even when collapsed.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const AnimatedHeight: Story = {
  render: () => html`
    <style>
      .animated-collapsible grund-collapsible-panel::part(panel) {
        overflow: hidden;
        transition: height 300ms ease, opacity 300ms ease;
      }
      .animated-collapsible grund-collapsible-panel[data-open]::part(panel) {
        height: var(--grund-collapsible-panel-height);
        opacity: 1;
      }
      .animated-collapsible grund-collapsible-panel:not([data-open])::part(panel) {
        height: 0;
        opacity: 0;
      }
      .animated-collapsible grund-collapsible-panel[data-starting-style]::part(panel) {
        height: 0;
        opacity: 0;
      }
      .animated-collapsible grund-collapsible-panel[data-ending-style]::part(panel) {
        height: 0;
        opacity: 0;
      }
    </style>
    <grund-collapsible class="animated-collapsible" @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Animated toggle</grund-collapsible-trigger>
      <grund-collapsible-panel keep-mounted>
        <p>This panel animates its height using CSS transitions and the exposed CSS variables.</p>
        <p>The component measures scrollHeight and exposes it as --grund-collapsible-panel-height.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const ReducedMotion: Story = {
  render: () => html`
    <style>
      .reduced-motion-collapsible grund-collapsible-panel::part(panel) {
        overflow: hidden;
        transition: height 300ms ease, opacity 300ms ease;
      }
      .reduced-motion-collapsible grund-collapsible-panel[data-open]::part(panel) {
        height: var(--grund-collapsible-panel-height);
        opacity: 1;
      }
      .reduced-motion-collapsible grund-collapsible-panel:not([data-open])::part(panel) {
        height: 0;
        opacity: 0;
      }
      .reduced-motion-collapsible grund-collapsible-panel[data-starting-style]::part(panel),
      .reduced-motion-collapsible grund-collapsible-panel[data-ending-style]::part(panel) {
        height: 0;
        opacity: 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .reduced-motion-collapsible grund-collapsible-panel::part(panel) {
          transition: none;
        }
      }
    </style>
    <grund-collapsible class="reduced-motion-collapsible" @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Respects reduced motion</grund-collapsible-trigger>
      <grund-collapsible-panel keep-mounted>
        <p>Animations disabled when prefers-reduced-motion: reduce is active.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};
