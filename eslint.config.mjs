import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
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
      import: importPlugin,
      'react-hooks': reactHooks,
    },
    extends: ['js/recommended'],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      // Prefer the TypeScript-aware variants / TS itself
      'no-unused-vars': 'off',
      'no-undef': 'off',

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
      // Member sort inside `{ a, b }` only; declaration order is handled by import/order
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal', 'parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
