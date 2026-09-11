import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  // ── 全局忽略（替代 .eslintignore）──
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/build/',
      '**/.turbo/',
      '**/coverage/',
      '**/*.d.ts',
      '**/*.js.map',
      '**/packages/*/dist/',
      '**/apps/*/dist/',
      '**/*.md',
      '**/*.json',
      '**/*.yaml',
      '**/*.yml',
    ],
  },

  // ── 基础推荐规则 ──
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── React ──
  reactPlugin.configs.flat.recommended,
  {
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // ── Prettier（必须放最后，禁用冲突规则）──
  prettierConfig,

  // ── 全局环境 ──
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // ── 项目规则 ──
  {
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // 通用
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',
    },
  },

  // ── 测试文件 ──
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/tests/**/*.ts'],
    languageOptions: {
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // ── Node.js 脚本 ──
  {
    files: ['**/*.cjs', '**/*.mjs', 'vitest.config.mts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // ── 应用文件 ──
  {
    files: ['apps/**/*.ts', 'apps/**/*.tsx'],
    rules: {
      'no-console': 'off',
    },
  },
);
