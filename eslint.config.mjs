import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    env: {
      node: true,
      es2021: true,
    },
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
    },
    rules: {
      'prettier/prettier': 'error',
    },
    languageOptions: { globals: globals.browser },
  },
]);
