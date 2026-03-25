import { html } from 'lit';
import { action } from 'storybook/actions';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundTabs } from '../src/components/tabs/index.js';

import '../src/components/tabs/index.js';

const meta: Meta<GrundTabs> = {
  title: 'Components/Tabs',
  component: 'grund-tabs',
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<GrundTabs>;

export const Default: Story = {
  render: (args) => html`
    <grund-tabs
      orientation=${args.orientation ?? 'horizontal'}
      ?disabled=${args.disabled}
      @grund-value-change=${action('grund-value-change')}
    >
      <grund-tabs-list>
        <grund-tab value="account">Account</grund-tab>
        <grund-tab value="password">Password</grund-tab>
        <grund-tab value="settings">Settings</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="account">
        <p>Manage your account settings and preferences.</p>
      </grund-tabs-panel>
      <grund-tabs-panel value="password">
        <p>Change your password and security settings.</p>
      </grund-tabs-panel>
      <grund-tabs-panel value="settings">
        <p>Configure application settings.</p>
      </grund-tabs-panel>
    </grund-tabs>
  `,
};

export const Vertical: Story = {
  render: () => html`
    <grund-tabs orientation="vertical" @grund-value-change=${action('grund-value-change')}>
      <grund-tabs-list>
        <grund-tab value="a">Tab A</grund-tab>
        <grund-tab value="b">Tab B</grund-tab>
        <grund-tab value="c">Tab C</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="a"><p>Panel A</p></grund-tabs-panel>
      <grund-tabs-panel value="b"><p>Panel B</p></grund-tabs-panel>
      <grund-tabs-panel value="c"><p>Panel C</p></grund-tabs-panel>
    </grund-tabs>
  `,
};

export const Controlled: Story = {
  render: () => {
    let activeTab = 'first';
    return html`
      <grund-tabs
        .value=${activeTab}
        @grund-value-change=${(e: CustomEvent) => {
          action('grund-value-change')(e);
          activeTab = e.detail.value;
        }}
      >
        <grund-tabs-list>
          <grund-tab value="first">First</grund-tab>
          <grund-tab value="second">Second</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="first"><p>Controlled first panel</p></grund-tabs-panel>
        <grund-tabs-panel value="second"><p>Controlled second panel</p></grund-tabs-panel>
      </grund-tabs>
    `;
  },
};

export const DefaultValue: Story = {
  render: () => html`
    <grund-tabs default-value="second" @grund-value-change=${action('grund-value-change')}>
      <grund-tabs-list>
        <grund-tab value="first">First</grund-tab>
        <grund-tab value="second">Second (default)</grund-tab>
        <grund-tab value="third">Third</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="first"><p>First panel</p></grund-tabs-panel>
      <grund-tabs-panel value="second"><p>Second panel (initially active)</p></grund-tabs-panel>
      <grund-tabs-panel value="third"><p>Third panel</p></grund-tabs-panel>
    </grund-tabs>
  `,
};

export const DisabledTab: Story = {
  render: () => html`
    <grund-tabs @grund-value-change=${action('grund-value-change')}>
      <grund-tabs-list>
        <grund-tab value="a">Enabled</grund-tab>
        <grund-tab value="b" disabled>Disabled</grund-tab>
        <grund-tab value="c">Enabled</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="a"><p>Panel A</p></grund-tabs-panel>
      <grund-tabs-panel value="b"><p>Panel B (unreachable)</p></grund-tabs-panel>
      <grund-tabs-panel value="c"><p>Panel C</p></grund-tabs-panel>
    </grund-tabs>
  `,
};

export const DisabledRoot: Story = {
  render: () => html`
    <grund-tabs disabled>
      <grund-tabs-list>
        <grund-tab value="a">Tab A</grund-tab>
        <grund-tab value="b">Tab B</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="a"><p>All tabs disabled</p></grund-tabs-panel>
      <grund-tabs-panel value="b"><p>Panel B</p></grund-tabs-panel>
    </grund-tabs>
  `,
};

export const ManualActivation: Story = {
  render: () => html`
    <grund-tabs @grund-value-change=${action('grund-value-change')}>
      <grund-tabs-list .activateOnFocus=${false}>
        <grund-tab value="a">Tab A</grund-tab>
        <grund-tab value="b">Tab B</grund-tab>
        <grund-tab value="c">Tab C</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="a"><p>Arrow keys move focus, Enter/Space activates</p></grund-tabs-panel>
      <grund-tabs-panel value="b"><p>Panel B</p></grund-tabs-panel>
      <grund-tabs-panel value="c"><p>Panel C</p></grund-tabs-panel>
    </grund-tabs>
  `,
};

export const WithIndicator: Story = {
  render: () => html`
    <grund-tabs @grund-value-change=${action('grund-value-change')}>
      <grund-tabs-list style="position: relative;">
        <grund-tab value="a">Tab A</grund-tab>
        <grund-tab value="b">Tab B</grund-tab>
        <grund-tab value="c">Tab C</grund-tab>
        <grund-tabs-indicator></grund-tabs-indicator>
      </grund-tabs-list>
      <grund-tabs-panel value="a"><p>Panel A</p></grund-tabs-panel>
      <grund-tabs-panel value="b"><p>Panel B</p></grund-tabs-panel>
      <grund-tabs-panel value="c"><p>Panel C</p></grund-tabs-panel>
    </grund-tabs>
    <style>
      grund-tabs-indicator {
        /* Consumers must provide positioning — the component exposes CSS custom properties only */
        position: absolute;
        pointer-events: none;
      }
      grund-tabs-indicator::part(indicator) {
        width: var(--grund-tabs-indicator-width);
        height: 2px;
        background: blue;
        transform: translateX(var(--grund-tabs-indicator-left));
        transition: transform 200ms ease, width 200ms ease;
      }
    </style>
  `,
};

export const KeepMounted: Story = {
  render: () => html`
    <grund-tabs @grund-value-change=${action('grund-value-change')}>
      <grund-tabs-list>
        <grund-tab value="a">Tab A</grund-tab>
        <grund-tab value="b">Tab B</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="a" keep-mounted><p>Panel A (always in DOM)</p></grund-tabs-panel>
      <grund-tabs-panel value="b" keep-mounted><p>Panel B (always in DOM)</p></grund-tabs-panel>
    </grund-tabs>
  `,
};

export const DynamicTabs: Story = {
  render: () => html`
    <div id="dynamic-demo">
      <button @click=${() => {
        const tabs = document.querySelector('#dynamic-tabs')! as GrundTabs;
        const list = tabs.querySelector('grund-tabs-list')!;
        const count = list.querySelectorAll('grund-tab').length + 1;
        const tab = document.createElement('grund-tab');
        tab.setAttribute('value', `tab-${count}`);
        tab.textContent = `Tab ${count}`;
        list.appendChild(tab);
        const panel = document.createElement('grund-tabs-panel');
        panel.setAttribute('value', `tab-${count}`);
        panel.innerHTML = `<p>Dynamic panel ${count}</p>`;
        tabs.appendChild(panel);
      }}>Add Tab</button>
      <grund-tabs id="dynamic-tabs" @grund-value-change=${action('grund-value-change')}>
        <grund-tabs-list>
          <grund-tab value="tab-1">Tab 1</grund-tab>
          <grund-tab value="tab-2">Tab 2</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="tab-1"><p>Panel 1</p></grund-tabs-panel>
        <grund-tabs-panel value="tab-2"><p>Panel 2</p></grund-tabs-panel>
      </grund-tabs>
    </div>
  `,
};

export const ManyTabs: Story = {
  render: () => {
    const tabs = Array.from({ length: 20 }, (_, i) => i + 1);
    return html`
      <grund-tabs @grund-value-change=${action('grund-value-change')}>
        <grund-tabs-list>
          ${tabs.map((n) => html`<grund-tab value="t${n}">Tab ${n}</grund-tab>`)}
        </grund-tabs-list>
        ${tabs.map((n) => html`
          <grund-tabs-panel value="t${n}"><p>Content for tab ${n}</p></grund-tabs-panel>
        `)}
      </grund-tabs>
    `;
  },
};

export const NoLoop: Story = {
  render: () => html`
    <grund-tabs @grund-value-change=${action('grund-value-change')}>
      <grund-tabs-list .loopFocus=${false}>
        <grund-tab value="a">Tab A</grund-tab>
        <grund-tab value="b">Tab B</grund-tab>
        <grund-tab value="c">Tab C</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="a"><p>Focus stops at boundaries</p></grund-tabs-panel>
      <grund-tabs-panel value="b"><p>Panel B</p></grund-tabs-panel>
      <grund-tabs-panel value="c"><p>Panel C</p></grund-tabs-panel>
    </grund-tabs>
  `,
};
