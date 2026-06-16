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

import { spawn } from 'node:child_process'

import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

spawn('npx', ['@modelcontextprotocol/inspector', 'node', 'dist/index.js'], {
  stdio: [
    'pipe', // stdin
    process.stdout, // stdout
    process.stderr, // rediriger stderr vers le parent
  ],
})
