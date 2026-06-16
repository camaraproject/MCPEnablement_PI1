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

import getDeviceLocation from '../api/device-location-retrieval'

export const registerTools = (mcpServer: McpServer): void => {
  mcpServer.registerTool(
    'get-device-location',
    {
      title: 'Get device location',
      description: 'Retrieve the geographical location (area) where a device is currently localized',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33699901032)'),
        maxAge: z.number().optional().describe('Maximum age of location data in seconds (optional)'),
      },
    },
    async ({ phoneNumber, maxAge }) => {
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

        // Validate maxAge if provided
        if (maxAge !== undefined && (maxAge < 0 || !Number.isInteger(maxAge))) {
          return {
            content: [{ type: 'text', text: '❌ MaxAge must be a non-negative integer representing seconds' }],
            isError: true,
          }
        }

        // Call API
        const location = await getDeviceLocation(phoneNumber, maxAge)

        // Format response
        let response = `📍 **Device Location for ${phoneNumber}**\n\n`

        // Add maxAge info if specified
        if (maxAge !== undefined) {
          response += `⏱️ **Max Age Requested**: ${maxAge} seconds\n`
        }

        response += `🕒 **Last Location Time**: ${location.lastLocationTime}\n\n`

        // Format area information
        if (location.area.areaType === 'CIRCLE') {
          const circle = location.area
          response += `🔵 **Area Type**: Circle\n`
          response += `📍 **Center**: ${circle.center.latitude}, ${circle.center.longitude}\n`
          response += `📏 **Radius**: ${circle.radius} meters\n`
        } else if (location.area.areaType === 'POLYGON') {
          const polygon = location.area
          response += `🔷 **Area Type**: Polygon\n`
          response += `📍 **Boundary Points** (${polygon.boundary.length} points):\n`
          polygon.boundary.forEach((point, index) => {
            response += `  ${index + 1}. ${point.latitude}, ${point.longitude}\n`
          })
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] get-device-location error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to get device location: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
