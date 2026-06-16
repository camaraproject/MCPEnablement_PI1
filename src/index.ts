#!/usr/bin/env node

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

import './config'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import registerTools from './tools'

const mcpServer = new McpServer({
  name: 'echo-server',
  version: '1.0.0',
})

registerTools(mcpServer)

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport()
    await mcpServer.connect(transport)
    console.error('[MCP server]: Conected')
  } catch (error) {
    console.error('[MCP Server] Failed to start:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('[MCP Server] Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.error('[MCP Server] Shutting down gracefully...')
  process.exit(0)
})

// Run the server
main().catch(error => {
  console.error('Server error:', error)
  process.exit(1)
})
