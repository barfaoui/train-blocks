import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', 'coverage/**', '.cursor/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      js,
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
    },
    extends: ['js/recommended'],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      eqeqeq: 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'sort-imports': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
