// Simple ESLint flat config for SvelteKit + TS
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
  // Ignore generated and build artifacts
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.svelte-kit/**',
      'src-tauri/target/**',
      '*.min.js',
      '*.min.css',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      '.vscode/**',
      '.idea/**',
      '.DS_Store',
      'Thumbs.db',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  // Default globals for app source (browser)
  {
    files: ['**/*'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // Svelte files
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: ['.svelte'],
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      svelte,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Node/config files
  {
    files: ['*.config.*', 'eslint.config.js', 'vite.config.*', 'prettier.config.*', 'src-tauri/**'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
    },
    rules: {
      'no-undef': 'off',
    },
  },
  // TS/JS project files (browser)
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
