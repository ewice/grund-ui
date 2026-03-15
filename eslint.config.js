import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import litPlugin from 'eslint-plugin-lit';
import wcPlugin from 'eslint-plugin-wc';
import storybookPlugin from 'eslint-plugin-storybook';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  litPlugin.configs['flat/recommended'],
  wcPlugin.configs['flat/best-practice'],
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'wc/attach-shadow-constructor': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts', 'src/**/*.visual.test.ts', 'src/test-utils/**'],
    languageOptions: {
      parserOptions: { project: true },
    },
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
    },
  },
  {
    files: ['stories/**/*.ts'],
    plugins: { storybook: storybookPlugin },
    rules: {
      ...storybookPlugin.configs.recommended.rules,
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'storybook-static/'],
  },
];
