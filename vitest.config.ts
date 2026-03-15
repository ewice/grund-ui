import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'components',
          include: ['src/**/*.test.ts', 'src/**/*.visual.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
            expect: {
              toMatchScreenshot: {
                // Allow up to 1% pixel difference to avoid flaky tests from
                // sub-pixel rendering differences across machines
                comparatorOptions: {
                  allowedMismatchedPixelRatio: 0.01,
                },
                // All baselines live in a single top-level directory, grouped
                // by component. Makes PR reviews and bulk updates much easier.
                // Output: __screenshots__/{component}/{name}-{browser}.png
                resolveScreenshotPath({ root, testFileName, arg, browserName, ext }) {
                  // testFileName is the bare filename (e.g. "accordion.visual.test.ts")
                  // Strip test suffixes to get the component name: "accordion"
                  const component = testFileName.replace(/\.(visual\.)?test\.ts$/, '');
                  return path.join(root, '__screenshots__', component, `${arg}-${browserName}${ext}`);
                },
              },
            },
          },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
