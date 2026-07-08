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

export const config = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.orange.com/camara/playground',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.API_RETRIES || '3', 10),
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Accept': 'application/json',
      'User-Agent': `camara-mcp-server/${process.env.MCP_SERVER_VERSION || '1.0.0'}`,
    },
  },
}

if (!config.api.clientId || !config.api.clientSecret) {
  throw new Error('Client ID and Client Secret are required for OAuth')
}

export default config
