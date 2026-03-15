import path from 'node:path';

import { defineConfig } from 'vitest/config';

import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'components',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.visual.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: './vite.config.ts',
        test: {
          name: 'visual',
          include: ['src/**/*.visual.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
            expect: {
              toMatchScreenshot: {
                comparatorOptions: { allowedMismatchedPixelRatio: 0.01 },
                resolveScreenshotPath({ root, testFileName, arg, browserName, ext }) {
                  const component = testFileName.replace(/\.(visual\.)?test\.ts$/, '');
                  const os = process.platform;
                  return path.join(root, '__screenshots__', component, os, `${arg}-${browserName}${ext}`);
                },
              },
            },
          },
        },
      },
    ],
  },
});
