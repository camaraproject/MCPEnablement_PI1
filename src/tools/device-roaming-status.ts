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

import getDeviceRoamingStatus from '../api/device-roaming-status'

export const registerTools = (mcpServer: McpServer): void => {
  mcpServer.registerTool(
    'get-device-roaming-status',
    {
      title: 'Get device roaming status',
      description: 'Retrieve roaming status and country information for a device/phone number',
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
        const roamingStatus = await getDeviceRoamingStatus(phoneNumber)

        // Format response
        let response = `🌍 **Device Roaming Status for ${phoneNumber}**\n\n`

        // Add last status time if available
        if (roamingStatus.lastStatusTime) {
          response += `🕒 **Last Status Time**: ${roamingStatus.lastStatusTime}\n`
        }

        // Roaming status
        if (roamingStatus.roaming) {
          response += `📡 **Roaming Status**: Yes, device is roaming\n`

          // Add country information if available
          if (roamingStatus.countryCode) {
            response += `🏳️ **Country Code**: ${roamingStatus.countryCode}\n`
          }

          if (roamingStatus.countryName && roamingStatus.countryName.length > 0) {
            response += `🌏 **Country Name**: ${roamingStatus.countryName.join(', ')}\n`
          }
        } else {
          response += `🏠 **Roaming Status**: No, device is in home network\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] get-device-roaming-status error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to get device roaming status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
