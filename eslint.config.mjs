/*
 * Software Name : Orange MCP Server Example
 * SPDX-FileCopyrightText: Copyright (c) Orange SA
 * SPDX-License-Identifier: Apache-2.0
 *
 * This software is distributed under the Apache-2.0 license,
 * see the "LICENSE" file for more details
 *
 * Authors: see MAINTAINERS.md
 * Software description: A Model Context Protocol (MCP) server
 * that provides tools to interact with
 * the Orange's Network APIs playground and administrative tools,
 * which follows the Camara specifications.
 */

// @ts-check
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { includeIgnoreFile } from '@eslint/compat'
import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

// ignore .gitignore root file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, '.gitignore')

export const gitIgnoreConfig = [includeIgnoreFile(gitignorePath)]

export const tseslintConfig = tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs',
    parserOptions: {
      project: false,
      tsconfigRootDir: __dirname,
    },
  },
  rules: {
    '@typescript-eslint/method-signature-style': ['error', 'property'],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowTernary: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
  },
})

export const simpleSortConfig = [
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
    },
  },
]

export const prettierConfig = [
  eslintPluginPrettierRecommended,
  {
    rules: {
      'prettier/prettier': 'error',
    },
  },
]

export default [...tseslintConfig, ...gitIgnoreConfig, ...simpleSortConfig, ...prettierConfig]
