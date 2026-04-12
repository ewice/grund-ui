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
    files: ['src/**/*.ts', 'stories/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*.js', './**/*.js', '../*.js', '../**/*.js'],
              message:
                'Use extensionless relative imports for local TypeScript modules. Keep explicit extensions only for package subpath imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn'] }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: ':matches(PropertyDefinition, MethodDefinition) > PrivateIdentifier.key',
          message:
            'Use TypeScript `private` instead of `#` private fields — `#` fields are incompatible with Lit decorators.',
        },
      ],
      'wc/attach-shadow-constructor': 'off',
      'wc/guard-super-call': 'off',
      'curly': ['error', 'all'],
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
    files: ['src/**/*.test.ts', 'src/**/*.visual.test.ts', 'src/test-utils/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
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
