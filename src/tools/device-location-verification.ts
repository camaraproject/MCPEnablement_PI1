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

import verifyDeviceLocation, { Area } from '../api/device-location-verification'

export const registerTools = (mcpServer: McpServer): void => {
  mcpServer.registerTool(
    'verify-device-location',
    {
      title: 'Verify device location',
      description: 'Verify if a device is within a specified circular area',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33699901032)'),
        latitude: z.number().describe('Latitude of the center point (-90 to 90)'),
        longitude: z.number().describe('Longitude of the center point (-180 to 180)'),
        radius: z.number().describe('Radius in meters (2000 to 200000)'),
        maxAge: z.number().optional().describe('Maximum age of location data in seconds (optional)'),
      },
    },
    async ({ phoneNumber, latitude, longitude, radius, maxAge }) => {
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

        // Validate latitude
        if (latitude === undefined || typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
          return {
            content: [{ type: 'text', text: '❌ Invalid latitude. Must be a number between -90 and 90' }],
            isError: true,
          }
        }

        // Validate longitude
        if (longitude === undefined || typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
          return {
            content: [{ type: 'text', text: '❌ Invalid longitude. Must be a number between -180 and 180' }],
            isError: true,
          }
        }

        // Validate radius
        if (
          radius === undefined ||
          typeof radius !== 'number' ||
          radius < 2000 ||
          radius > 200000 ||
          !Number.isInteger(radius)
        ) {
          return {
            content: [{ type: 'text', text: '❌ Radius must be an integer between 2000 and 200000 meters' }],
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

        // Create area object
        const area: Area = {
          areaType: 'CIRCLE',
          center: {
            latitude,
            longitude,
          },
          radius,
        }

        // Call API
        const verification = await verifyDeviceLocation(phoneNumber, area, maxAge)

        // Format response
        let response = `🎯 **Device Location Verification for ${phoneNumber}**\n\n`

        // Add verification area details
        response += `📍 **Target Area**: Circle\n`
        response += `🌐 **Center**: ${latitude}, ${longitude}\n`
        response += `📏 **Radius**: ${radius} meters\n`

        // Add maxAge info if specified
        if (maxAge !== undefined) {
          response += `⏱️ **Max Age Requested**: ${maxAge} seconds\n`
        }

        // Add last location time if available
        if (verification.lastLocationTime) {
          response += `🕒 **Last Location Time**: ${verification.lastLocationTime}\n`
        }

        response += `\n`

        // Format verification result with appropriate emoji and description
        let resultEmoji = ''
        let resultDescription = ''

        switch (verification.verificationResult) {
          case 'TRUE':
            resultEmoji = '✅'
            resultDescription = 'Device is within the requested area'
            break
          case 'FALSE':
            resultEmoji = '❌'
            resultDescription = 'Device is NOT within the requested area'
            break
          case 'PARTIAL':
            resultEmoji = '🟡'
            resultDescription = `Device partially matches the area${
              verification.matchRate ? ` (${verification.matchRate}% match rate)` : ''
            }`
            break
          case 'UNKNOWN':
            resultEmoji = '❓'
            resultDescription = 'Unable to locate the device'
            break
          default:
            resultEmoji = '⚪'
            resultDescription = 'Unknown verification result'
        }

        response += `${resultEmoji} **Verification Result**: ${verification.verificationResult}\n`
        response += `📋 **Description**: ${resultDescription}\n`

        // Add match rate if available and not already included
        if (verification.matchRate && verification.verificationResult !== 'PARTIAL') {
          response += `📊 **Match Rate**: ${verification.matchRate}%\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] verify-device-location error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to verify device location: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
