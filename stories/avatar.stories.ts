import { html } from 'lit';
import { action } from 'storybook/actions';
import { expect } from 'storybook/test';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundAvatar, AvatarStatusChangeDetail } from '../src/components/avatar';

import '../src/components/avatar';

const PORTRAIT =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23888'/><text x='24' y='30' text-anchor='middle' fill='white' font-family='sans-serif' font-size='20'>J</text></svg>";

const onStatusChange = (e: CustomEvent<AvatarStatusChangeDetail>) =>
  action('grund-status-change')(e.detail.status);

const meta: Meta<GrundAvatar> = {
  title: 'Components/Avatar',
  component: 'grund-avatar',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<GrundAvatar>;

export const ImageWithFallback: Story = {
  name: 'Image with fallback initials',
  render: () => html`
    <style>
      grund-avatar::part(root) {
        display: inline-flex;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        background: #eee;
        align-items: center;
        justify-content: center;
        font-family: sans-serif;
      }
      grund-avatar-image::part(image) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    </style>
    <grund-avatar @grund-status-change=${onStatusChange}>
      <grund-avatar-image src=${PORTRAIT} alt="Jane Doe"></grund-avatar-image>
      <grund-avatar-fallback aria-hidden="true">JD</grund-avatar-fallback>
    </grund-avatar>
  `,
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('grund-avatar')!;
    const start = Date.now();
    while (avatar.getAttribute('data-status') !== 'loaded' && Date.now() - start < 1000) {
      await new Promise<void>((r) => setTimeout(r, 20));
    }
    expect(avatar.getAttribute('data-status')).toBe('loaded');
  },
};

export const BrokenImageFallsBack: Story = {
  name: 'Broken image falls back to initials',
  render: () => html`
    <style>
      grund-avatar::part(root) {
        display: inline-flex;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        background: #eee;
        align-items: center;
        justify-content: center;
        font-family: sans-serif;
      }
    </style>
    <grund-avatar @grund-status-change=${onStatusChange}>
      <grund-avatar-image src="does-not-exist.png" alt="Jane Doe"></grund-avatar-image>
      <grund-avatar-fallback aria-hidden="true">JD</grund-avatar-fallback>
    </grund-avatar>
  `,
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('grund-avatar')!;
    // Wait for error transition.
    const start = Date.now();
    while (avatar.getAttribute('data-status') !== 'error' && Date.now() - start < 1000) {
      await new Promise<void>((r) => setTimeout(r, 20));
    }
    expect(avatar.getAttribute('data-status')).toBe('error');
  },
};

export const InitialsOnly: Story = {
  name: 'Initials only (no image)',
  render: () => html`
    <style>
      grund-avatar::part(root) {
        display: inline-flex;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #ddd;
        align-items: center;
        justify-content: center;
        font-family: sans-serif;
      }
    </style>
    <grund-avatar>
      <grund-avatar-fallback>JD</grund-avatar-fallback>
    </grund-avatar>
  `,
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('grund-avatar')!;
    expect(avatar.getAttribute('data-status')).toBe('idle');
    expect(avatar.textContent?.trim()).toContain('JD');
  },
};

export const FallbackWithDelay: Story = {
  name: 'Fallback with delay (prevents flash on fast load)',
  render: () => html`
    <style>
      grund-avatar::part(root) {
        display: inline-flex;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #ddd;
        align-items: center;
        justify-content: center;
        font-family: sans-serif;
      }
    </style>
    <grund-avatar>
      <grund-avatar-image src=${PORTRAIT} alt="Jane"></grund-avatar-image>
      <grund-avatar-fallback delay="500" aria-hidden="true">JD</grund-avatar-fallback>
    </grund-avatar>
  `,
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector('grund-avatar')!;
    const start = Date.now();
    while (avatar.getAttribute('data-status') !== 'loaded' && Date.now() - start < 1000) {
      await new Promise<void>((r) => setTimeout(r, 20));
    }
    expect(avatar.getAttribute('data-status')).toBe('loaded');
  },
};
