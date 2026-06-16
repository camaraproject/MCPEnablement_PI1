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

import type { QosProfileDeviceRequest } from '../api/qos-profiles'
import { getQosProfile, retrieveQosProfiles } from '../api/qos-profiles'

export const registerTools = (mcpServer: McpServer): void => {
  // Tool to retrieve all QoS profiles
  mcpServer.registerTool(
    'retrieve-qos-profiles',
    {
      title: 'Retrieve QoS Profiles',
      description: 'Retrieve all available Quality of Service profiles managed by the server',
      inputSchema: {
        devicePhoneNumber: z.string().optional().describe('Phone number in E.164 format to filter profiles (optional)'),
        profileName: z.string().optional().describe('QoS profile name to filter by (optional)'),
        status: z
          .enum(['ACTIVE', 'INACTIVE', 'DEPRECATED'])
          .optional()
          .describe('Status to filter profiles by (optional)'),
      },
    },
    async ({ devicePhoneNumber, profileName, status }) => {
      try {
        // Validate phone number format if provided
        if (devicePhoneNumber && !devicePhoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33699901032)' }],
            isError: true,
          }
        }

        // Build request object
        const request: QosProfileDeviceRequest = {}
        if (devicePhoneNumber || profileName || status) {
          if (devicePhoneNumber) {
            request.device = { phoneNumber: devicePhoneNumber }
          }
          if (profileName) {
            request.name = profileName
          }
          if (status) {
            request.status = status
          }
        }

        // Call API
        const profiles = await retrieveQosProfiles(Object.keys(request).length > 0 ? request : undefined)

        // Format response
        let response = `🎯 **QoS Profiles** (${profiles.length} profiles found)\n\n`

        if (profiles.length === 0) {
          response += '📭 No QoS profiles found matching the criteria.\n'
          return {
            content: [{ type: 'text', text: response }],
          }
        }

        profiles.forEach((profile, index) => {
          response += `**${index + 1}. ${profile.name}**\n`
          response += `📝 **Description**: ${profile.description}\n`
          response += `🔄 **Status**: ${profile.status}\n`

          if (profile.maxUpstreamRate) {
            response += `⬆️ **Max Upstream**: ${profile.maxUpstreamRate.value} ${profile.maxUpstreamRate.unit}\n`
          }
          if (profile.maxDownstreamRate) {
            response += `⬇️ **Max Downstream**: ${profile.maxDownstreamRate.value} ${profile.maxDownstreamRate.unit}\n`
          }
          if (profile.minDuration) {
            response += `⏱️ **Min Duration**: ${profile.minDuration.value} ${profile.minDuration.unit}\n`
          }
          if (profile.maxDuration) {
            response += `⏰ **Max Duration**: ${profile.maxDuration.value} ${profile.maxDuration.unit}\n`
          }
          if (profile.priority !== undefined) {
            response += `🔢 **Priority**: ${profile.priority}\n`
          }

          response += '\n---\n\n'
        })

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] retrieve-qos-profiles error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to retrieve QoS profiles: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool to get a specific QoS profile by name
  mcpServer.registerTool(
    'get-qos-profile',
    {
      title: 'Get QoS Profile',
      description: 'Get detailed information about a specific Quality of Service profile by name',
      inputSchema: {
        profileName: z.string().describe('Name of the QoS profile to retrieve'),
      },
    },
    async ({ profileName }) => {
      try {
        // Validate profile name
        if (!profileName || typeof profileName !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Profile name is required and must be a string' }],
            isError: true,
          }
        }

        // Call API
        const profile = await getQosProfile(profileName)

        // Format response
        let response = `🎯 **QoS Profile Details: ${profile.name}**\n\n`
        response += `📝 **Description**: ${profile.description}\n`
        response += `🔄 **Status**: ${profile.status}\n\n`

        // Rate information
        response += `📊 **Rate Information**:\n`
        if (profile.targetMinUpstreamRate) {
          response += `  ⬆️ Target Min Upstream: ${profile.targetMinUpstreamRate.value} ${profile.targetMinUpstreamRate.unit}\n`
        }
        if (profile.maxUpstreamRate) {
          response += `  ⬆️ Max Upstream: ${profile.maxUpstreamRate.value} ${profile.maxUpstreamRate.unit}\n`
        }
        if (profile.maxUpstreamBurstRate) {
          response += `  ⬆️ Max Upstream Burst: ${profile.maxUpstreamBurstRate.value} ${profile.maxUpstreamBurstRate.unit}\n`
        }
        if (profile.targetMinDownstreamRate) {
          response += `  ⬇️ Target Min Downstream: ${profile.targetMinDownstreamRate.value} ${profile.targetMinDownstreamRate.unit}\n`
        }
        if (profile.maxDownstreamRate) {
          response += `  ⬇️ Max Downstream: ${profile.maxDownstreamRate.value} ${profile.maxDownstreamRate.unit}\n`
        }
        if (profile.maxDownstreamBurstRate) {
          response += `  ⬇️ Max Downstream Burst: ${profile.maxDownstreamBurstRate.value} ${profile.maxDownstreamBurstRate.unit}\n`
        }

        response += `\n⏱️ **Duration Information**:\n`
        if (profile.minDuration) {
          response += `  ⏱️ Min Duration: ${profile.minDuration.value} ${profile.minDuration.unit}\n`
        }
        if (profile.maxDuration) {
          response += `  ⏰ Max Duration: ${profile.maxDuration.value} ${profile.maxDuration.unit}\n`
        }

        response += `\n🔧 **Other Parameters**:\n`
        if (profile.priority !== undefined) {
          response += `  🔢 Priority: ${profile.priority} (lower = higher priority)\n`
        }
        if (profile.packetDelayBudget) {
          response += `  📦 Packet Delay Budget: ${profile.packetDelayBudget.value} ${profile.packetDelayBudget.unit}\n`
        }
        if (profile.jitter) {
          response += `  🔀 Jitter: ${profile.jitter.value} ${profile.jitter.unit}\n`
        }
        if (profile.packetErrorLossRate !== undefined) {
          response += `  ❌ Packet Error Loss Rate: ${profile.packetErrorLossRate}%\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] get-qos-profile error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to get QoS profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
