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

import type { ApplicationServer, CreateSessionRequest, Device } from '../api/quality-on-demand'
import { createSession, deleteSession, extendSession, getSession, retrieveSessions } from '../api/quality-on-demand'

export const registerTools = (mcpServer: McpServer): void => {
  // Tool to create a QoS session
  mcpServer.registerTool(
    'create-qos-session',
    {
      title: 'Create QoS Session',
      description:
        'Create a Quality of Service session with improved performance between a device and application server',
      inputSchema: {
        devicePhoneNumber: z.string().optional().describe('Device phone number in E.164 format (e.g., +33699901032)'),
        deviceIpv4PublicAddress: z.string().optional().describe('Device public IPv4 address'),
        deviceIpv4PrivateAddress: z.string().optional().describe('Device private IPv4 address'),
        deviceIpv4PublicPort: z.number().optional().describe('Device public port number'),
        deviceIpv6Address: z.string().optional().describe('Device IPv6 address'),
        deviceNetworkAccessIdentifier: z.string().optional().describe('Device network access identifier'),
        applicationServerIpv4: z.string().optional().describe('Application server IPv4 address'),
        applicationServerIpv6: z.string().optional().describe('Application server IPv6 address'),
        qosProfile: z.string().describe('QoS profile name to use for the session'),
        duration: z.number().optional().describe('Session duration in seconds (optional, max 24h)'),
        devicePorts: z.array(z.number()).optional().describe('Array of device port numbers (optional)'),
        devicePortRanges: z
          .array(
            z.object({
              from: z.number(),
              to: z.number(),
            }),
          )
          .optional()
          .describe('Array of device port ranges (optional)'),
        applicationServerPorts: z
          .array(z.number())
          .optional()
          .describe('Array of application server port numbers (optional)'),
        applicationServerPortRanges: z
          .array(
            z.object({
              from: z.number(),
              to: z.number(),
            }),
          )
          .optional()
          .describe('Array of application server port ranges (optional)'),
        notificationUrl: z.string().optional().describe('Webhook URL for session notifications (optional)'),
        notificationToken: z.string().optional().describe('Authentication token for webhook notifications (optional)'),
      },
    },
    async ({
      devicePhoneNumber,
      deviceIpv4PublicAddress,
      deviceIpv4PrivateAddress,
      deviceIpv4PublicPort,
      deviceIpv6Address,
      deviceNetworkAccessIdentifier,
      applicationServerIpv4,
      applicationServerIpv6,
      qosProfile,
      duration,
      devicePorts,
      devicePortRanges,
      applicationServerPorts,
      applicationServerPortRanges,
      notificationUrl,
      notificationToken,
    }) => {
      try {
        // Validate at least one device identifier is provided
        if (!devicePhoneNumber && !deviceIpv4PublicAddress && !deviceIpv6Address && !deviceNetworkAccessIdentifier) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ At least one device identifier is required (phoneNumber, IPv4, IPv6, or networkAccessIdentifier)',
              },
            ],
            isError: true,
          }
        }

        // Validate at least one application server address is provided
        if (!applicationServerIpv4 && !applicationServerIpv6) {
          return {
            content: [{ type: 'text', text: '❌ At least one application server address is required (IPv4 or IPv6)' }],
            isError: true,
          }
        }

        // Validate phone number format if provided
        if (devicePhoneNumber && !devicePhoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33699901032)' }],
            isError: true,
          }
        }

        // Validate QoS profile
        if (!qosProfile || typeof qosProfile !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ QoS profile name is required and must be a string' }],
            isError: true,
          }
        }

        // Validate duration if provided
        if (duration !== undefined && (duration <= 0 || duration > 86400)) {
          return {
            content: [{ type: 'text', text: '❌ Duration must be between 1 and 86400 seconds (24 hours)' }],
            isError: true,
          }
        }

        // Build device object
        const device: Device = {}
        if (devicePhoneNumber) device.phoneNumber = devicePhoneNumber
        if (deviceNetworkAccessIdentifier) device.networkAccessIdentifier = deviceNetworkAccessIdentifier
        if (deviceIpv6Address) device.ipv6Address = deviceIpv6Address

        if (deviceIpv4PublicAddress) {
          device.ipv4Address = { publicAddress: deviceIpv4PublicAddress }
          if (deviceIpv4PrivateAddress) device.ipv4Address.privateAddress = deviceIpv4PrivateAddress
          if (deviceIpv4PublicPort) device.ipv4Address.publicPort = deviceIpv4PublicPort
        }

        // Build application server object
        const applicationServer: ApplicationServer = {}
        if (applicationServerIpv4) applicationServer.ipv4Address = applicationServerIpv4
        if (applicationServerIpv6) applicationServer.ipv6Address = applicationServerIpv6

        // Build request object
        const request: CreateSessionRequest = {
          device,
          applicationServer,
          qosProfile,
        }

        if (duration) request.duration = duration

        // Add device ports if provided
        if (devicePorts || devicePortRanges) {
          request.devicePorts = {}
          if (devicePorts) request.devicePorts.ports = devicePorts
          if (devicePortRanges) request.devicePorts.ranges = devicePortRanges
        }

        // Add application server ports if provided
        if (applicationServerPorts || applicationServerPortRanges) {
          request.applicationServerPorts = {}
          if (applicationServerPorts) request.applicationServerPorts.ports = applicationServerPorts
          if (applicationServerPortRanges) request.applicationServerPorts.ranges = applicationServerPortRanges
        }

        // Add webhook notification if provided
        if (notificationUrl) {
          request.sink = notificationUrl
          if (notificationToken) {
            request.sinkCredential = {
              credentialType: 'ACCESSTOKEN',
              accessToken: notificationToken,
              accessTokenType: 'bearer',
            }
          }
        }

        // Call API
        const session = await createSession(request)

        // Format response
        let response = `✅ **QoS Session Created Successfully**\n\n`
        response += `🆔 **Session ID**: ${session.sessionId}\n`
        response += `🎯 **QoS Profile**: ${session.qosProfile}\n`
        response += `📊 **Status**: ${session.qosStatus}\n`
        response += `⏰ **Started At**: ${session.startedAt}\n`
        response += `⏰ **Expires At**: ${session.expiresAt}\n`

        if (session.duration) {
          response += `⏱️ **Duration**: ${session.duration} seconds\n`
        }

        response += `\n📱 **Device**:\n`
        if (session.device.phoneNumber) response += `  📞 Phone: ${session.device.phoneNumber}\n`
        if (session.device.ipv4Address) {
          response += `  🌐 IPv4: ${session.device.ipv4Address.publicAddress}`
          if (session.device.ipv4Address.privateAddress)
            response += ` (private: ${session.device.ipv4Address.privateAddress})`
          if (session.device.ipv4Address.publicPort) response += ` (port: ${session.device.ipv4Address.publicPort})`
          response += `\n`
        }
        if (session.device.ipv6Address) response += `  🌐 IPv6: ${session.device.ipv6Address}\n`

        response += `\n🖥️ **Application Server**:\n`
        if (session.applicationServer.ipv4Address) response += `  🌐 IPv4: ${session.applicationServer.ipv4Address}\n`
        if (session.applicationServer.ipv6Address) response += `  🌐 IPv6: ${session.applicationServer.ipv6Address}\n`

        if (session.sink) {
          response += `\n📡 **Notifications**: ${session.sink}\n`
        }

        if (session.statusInfo) {
          response += `\nℹ️ **Status Info**: ${session.statusInfo}\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] create-qos-session error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to create QoS session: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool to get a QoS session
  mcpServer.registerTool(
    'get-qos-session',
    {
      title: 'Get QoS Session',
      description: 'Retrieve information about a specific Quality of Service session',
      inputSchema: {
        sessionId: z.string().describe('Session ID (UUID format)'),
      },
    },
    async ({ sessionId }) => {
      try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Session ID is required and must be a string' }],
            isError: true,
          }
        }

        // Call API
        const session = await getSession(sessionId)

        // Format response
        let response = `🔍 **QoS Session Details**\n\n`
        response += `🆔 **Session ID**: ${session.sessionId}\n`
        response += `🎯 **QoS Profile**: ${session.qosProfile}\n`
        response += `📊 **Status**: ${session.qosStatus}\n`
        response += `⏰ **Started At**: ${session.startedAt}\n`
        response += `⏰ **Expires At**: ${session.expiresAt}\n`

        if (session.duration) {
          response += `⏱️ **Duration**: ${session.duration} seconds\n`
        }

        response += `\n📱 **Device**:\n`
        if (session.device.phoneNumber) response += `  📞 Phone: ${session.device.phoneNumber}\n`
        if (session.device.networkAccessIdentifier) response += `  🆔 NAI: ${session.device.networkAccessIdentifier}\n`
        if (session.device.ipv4Address) {
          response += `  🌐 IPv4: ${session.device.ipv4Address.publicAddress}`
          if (session.device.ipv4Address.privateAddress)
            response += ` (private: ${session.device.ipv4Address.privateAddress})`
          if (session.device.ipv4Address.publicPort) response += ` (port: ${session.device.ipv4Address.publicPort})`
          response += `\n`
        }
        if (session.device.ipv6Address) response += `  🌐 IPv6: ${session.device.ipv6Address}\n`

        response += `\n🖥️ **Application Server**:\n`
        if (session.applicationServer.ipv4Address) response += `  🌐 IPv4: ${session.applicationServer.ipv4Address}\n`
        if (session.applicationServer.ipv6Address) response += `  🌐 IPv6: ${session.applicationServer.ipv6Address}\n`

        if (session.devicePorts) {
          response += `\n📱 **Device Ports**:\n`
          if (session.devicePorts.ports) response += `  🔢 Ports: ${session.devicePorts.ports.join(', ')}\n`
          if (session.devicePorts.ranges) {
            response += `  📊 Ranges: ${session.devicePorts.ranges.map(r => `${r.from}-${r.to}`).join(', ')}\n`
          }
        }

        if (session.applicationServerPorts) {
          response += `\n🖥️ **Application Server Ports**:\n`
          if (session.applicationServerPorts.ports)
            response += `  🔢 Ports: ${session.applicationServerPorts.ports.join(', ')}\n`
          if (session.applicationServerPorts.ranges) {
            response += `  📊 Ranges: ${session.applicationServerPorts.ranges.map(r => `${r.from}-${r.to}`).join(', ')}\n`
          }
        }

        if (session.sink) {
          response += `\n📡 **Notifications**: ${session.sink}\n`
        }

        if (session.statusInfo) {
          response += `\nℹ️ **Status Info**: ${session.statusInfo}\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] get-qos-session error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to get QoS session: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool to delete a QoS session
  mcpServer.registerTool(
    'delete-qos-session',
    {
      title: 'Delete QoS Session',
      description: 'Terminate a Quality of Service session before its planned end time',
      inputSchema: {
        sessionId: z.string().describe('Session ID (UUID format)'),
      },
    },
    async ({ sessionId }) => {
      try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Session ID is required and must be a string' }],
            isError: true,
          }
        }

        // Call API
        await deleteSession(sessionId)

        // Format response
        const response = `✅ **QoS Session Deleted Successfully**\n\n🆔 **Session ID**: ${sessionId}\n\nThe session has been terminated and is no longer active.`

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] delete-qos-session error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to delete QoS session: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool to extend a QoS session
  mcpServer.registerTool(
    'extend-qos-session',
    {
      title: 'Extend QoS Session',
      description: 'Extend the duration of an existing Quality of Service session',
      inputSchema: {
        sessionId: z.string().describe('Session ID (UUID format)'),
        additionalDuration: z.number().describe('Additional duration in seconds to extend the session'),
      },
    },
    async ({ sessionId, additionalDuration }) => {
      try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Session ID is required and must be a string' }],
            isError: true,
          }
        }

        // Validate additional duration
        if (!additionalDuration || additionalDuration <= 0) {
          return {
            content: [{ type: 'text', text: '❌ Additional duration must be a positive number' }],
            isError: true,
          }
        }

        // Call API
        const session = await extendSession(sessionId, { requestedAdditionalDuration: additionalDuration })

        // Format response
        let response = `✅ **QoS Session Extended Successfully**\n\n`
        response += `🆔 **Session ID**: ${session.sessionId}\n`
        response += `🎯 **QoS Profile**: ${session.qosProfile}\n`
        response += `📊 **Status**: ${session.qosStatus}\n`
        response += `⏰ **Started At**: ${session.startedAt}\n`
        response += `⏰ **New Expires At**: ${session.expiresAt}\n`
        response += `⏱️ **Additional Duration Added**: ${additionalDuration} seconds\n`

        if (session.duration) {
          response += `⏱️ **Total Duration**: ${session.duration} seconds\n`
        }

        if (session.statusInfo) {
          response += `\nℹ️ **Status Info**: ${session.statusInfo}\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] extend-qos-session error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to extend QoS session: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool to retrieve QoS sessions for a device
  mcpServer.registerTool(
    'retrieve-qos-sessions',
    {
      title: 'Retrieve QoS Sessions',
      description: 'Retrieve all Quality of Service sessions for a specific device',
      inputSchema: {
        devicePhoneNumber: z.string().optional().describe('Device phone number in E.164 format (e.g., +33699901032)'),
        deviceIpv4PublicAddress: z.string().optional().describe('Device public IPv4 address'),
        deviceIpv4PrivateAddress: z.string().optional().describe('Device private IPv4 address'),
        deviceIpv4PublicPort: z.number().optional().describe('Device public port number'),
        deviceIpv6Address: z.string().optional().describe('Device IPv6 address'),
        deviceNetworkAccessIdentifier: z.string().optional().describe('Device network access identifier'),
      },
    },
    async ({
      devicePhoneNumber,
      deviceIpv4PublicAddress,
      deviceIpv4PrivateAddress,
      deviceIpv4PublicPort,
      deviceIpv6Address,
      deviceNetworkAccessIdentifier,
    }) => {
      try {
        // Validate at least one device identifier is provided
        if (!devicePhoneNumber && !deviceIpv4PublicAddress && !deviceIpv6Address && !deviceNetworkAccessIdentifier) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ At least one device identifier is required (phoneNumber, IPv4, IPv6, or networkAccessIdentifier)',
              },
            ],
            isError: true,
          }
        }

        // Validate phone number format if provided
        if (devicePhoneNumber && !devicePhoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33699901032)' }],
            isError: true,
          }
        }

        // Build device object
        const device: Device = {}
        if (devicePhoneNumber) device.phoneNumber = devicePhoneNumber
        if (deviceNetworkAccessIdentifier) device.networkAccessIdentifier = deviceNetworkAccessIdentifier
        if (deviceIpv6Address) device.ipv6Address = deviceIpv6Address

        if (deviceIpv4PublicAddress) {
          device.ipv4Address = { publicAddress: deviceIpv4PublicAddress }
          if (deviceIpv4PrivateAddress) device.ipv4Address.privateAddress = deviceIpv4PrivateAddress
          if (deviceIpv4PublicPort) device.ipv4Address.publicPort = deviceIpv4PublicPort
        }

        // Call API
        const sessions = await retrieveSessions({ device })

        // Format response
        let response = `🔍 **QoS Sessions for Device** (${sessions.length} sessions found)\n\n`

        if (sessions.length === 0) {
          response += '📭 No active QoS sessions found for this device.\n'
          return {
            content: [{ type: 'text', text: response }],
          }
        }

        sessions.forEach((session, index) => {
          response += `**${index + 1}. Session ${session.sessionId}**\n`
          response += `🎯 **QoS Profile**: ${session.qosProfile}\n`
          response += `📊 **Status**: ${session.qosStatus}\n`
          response += `⏰ **Started**: ${session.startedAt}\n`
          response += `⏰ **Expires**: ${session.expiresAt}\n`

          if (session.applicationServer.ipv4Address || session.applicationServer.ipv6Address) {
            response += `🖥️ **App Server**: `
            if (session.applicationServer.ipv4Address) response += session.applicationServer.ipv4Address
            if (session.applicationServer.ipv6Address) response += session.applicationServer.ipv6Address
            response += `\n`
          }

          if (session.statusInfo) {
            response += `ℹ️ **Status Info**: ${session.statusInfo}\n`
          }

          response += '\n---\n\n'
        })

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] retrieve-qos-sessions error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to retrieve QoS sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
