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
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import getDeviceReachabilityStatus from '../api/device-reachability-status'

export const registerTools = (mcpServer: McpServer): void => {
  mcpServer.registerTool(
    'get-device-reachability-status',
    {
      title: 'Get device reachability status',
      description: 'Retrieve the current reachability status (connectivity) of a device/phone number',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33699901032)'),
      },
    },
    async ({ phoneNumber }) => {
      try {
        // Validate phone number format
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        // Validate phone number format
        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33699901032)' }],
            isError: true,
          }
        }

        // Call API
        const reachabilityStatus = await getDeviceReachabilityStatus(phoneNumber)

        // Format response
        let response = `📱 **Device Reachability Status for ${phoneNumber}**\n\n`

        // Add last status time if available
        if (reachabilityStatus.lastStatusTime) {
          response += `🕒 **Last Status Time**: ${reachabilityStatus.lastStatusTime}\n`
        }

        // Format status with appropriate emoji and description
        let statusEmoji = ''
        let statusDescription = ''

        switch (reachabilityStatus.reachabilityStatus) {
          case 'CONNECTED_DATA':
            statusEmoji = '🟢'
            statusDescription = 'Connected via data (can receive SMS and data)'
            break
          case 'CONNECTED_SMS':
            statusEmoji = '🟡'
            statusDescription = 'Connected via SMS only (no data connection)'
            break
          case 'NOT_CONNECTED':
            statusEmoji = '🔴'
            statusDescription = 'Not connected to the network'
            break
          default:
            statusEmoji = '⚪'
            statusDescription = 'Unknown status'
        }

        response += `${statusEmoji} **Reachability Status**: ${reachabilityStatus.reachabilityStatus}\n`
        response += `📋 **Description**: ${statusDescription}\n`

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] get-device-reachability-status error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to get device reachability status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
