import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [
    storybookTest({ configDir: '.storybook' }),
  ],
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: 'chromium' }],
      // Storybook compilation on CI (no Vite cache) consistently exceeds
      // the default 60s. Project-level connectTimeout is ignored due to a
      // Vitest bug, so this config is a separate file where it takes effect.
      connectTimeout: 120_000,
    },
    setupFiles: ['.storybook/vitest.setup.ts'],
  },
});
