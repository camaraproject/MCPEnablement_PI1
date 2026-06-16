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

import { checkSimSwap, getSimSwapDate } from '../api/sim-swap'

export const registerTools = (mcpServer: McpServer): void => {
  // Tool for getting SIM swap date
  mcpServer.registerTool(
    'get-sim-swap-date',
    {
      title: 'Get SIM swap date',
      description: 'Retrieve the timestamp of the latest SIM swap event for a phone number',
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
        const simSwapInfo = await getSimSwapDate(phoneNumber)

        // Format response
        let response = `📱 **SIM Swap Date for ${phoneNumber}**\n\n`

        if (simSwapInfo.latestSimChange) {
          response += `🔄 **Latest SIM Change**: ${simSwapInfo.latestSimChange}\n`
          response += `✅ **Has SIM Swap**: Yes\n`
        } else {
          response += `🔄 **Latest SIM Change**: No SIM swap detected\n`
          response += `❌ **Has SIM Swap**: No\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] get-sim-swap-date error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to get SIM swap date: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for checking SIM swap within a period
  mcpServer.registerTool(
    'check-sim-swap',
    {
      title: 'Check SIM swap',
      description: 'Check if a SIM swap occurred in the last X hours for a phone number',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33699901032)'),
        hours: z.number().describe('Number of hours to check back (e.g., 24 for last 24 hours)'),
      },
    },
    async ({ phoneNumber, hours }) => {
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

        // Validate hours
        if (hours === undefined || typeof hours !== 'number' || hours < 1 || hours > 2400 || !Number.isInteger(hours)) {
          return {
            content: [{ type: 'text', text: '❌ Hours must be an integer between 1 and 2400' }],
            isError: true,
          }
        }

        // Call API
        const simSwapCheck = await checkSimSwap(phoneNumber, hours)

        // Format response
        let response = `📱 **SIM Swap Check for ${phoneNumber}**\n\n`
        response += `⏱️ **Period Checked**: Last ${hours} hours\n`

        if (simSwapCheck.swapped) {
          response += `🚨 **SIM Swap Detected**: Yes\n`
          response += `⚠️ **Warning**: A SIM swap occurred in the last ${hours} hours\n`
        } else {
          response += `✅ **SIM Swap Detected**: No\n`
          response += `🛡️ **Status**: No SIM swap detected in the last ${hours} hours\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] check-sim-swap error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to check SIM swap: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
