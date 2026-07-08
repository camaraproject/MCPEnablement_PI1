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

import { adminAction } from '../api/playground-admin'

export const registerTools = (mcpServer: McpServer): void => {
  // Tool for listing phone numbers
  mcpServer.registerTool(
    'list-playground-phone-numbers',
    {
      title: 'List playground phone numbers',
      description: 'List all phone numbers in the playground',
      inputSchema: {},
    },
    async () => {
      try {
        // Call API
        const result = await adminAction({ action: 'LIST' })

        // Format response
        let response = `📋 **Playground Phone Numbers**\n\n`

        if ('phoneNumbers' in result) {
          if (result.phoneNumbers.length === 0) {
            response += `📱 **Count**: 0 phone numbers\n`
            response += `ℹ️ **Info**: No phone numbers found in playground\n`
          } else {
            response += `📱 **Count**: ${result.phoneNumbers.length} phone numbers\n\n`
            response += `📞 **Phone Numbers**:\n`
            result.phoneNumbers.forEach((phoneNumber, index) => {
              response += `  ${index + 1}. ${phoneNumber}\n`
            })
          }
        } else {
          response += `❌ **Error**: Unexpected response format\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] list-playground-phone-numbers error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to list phone numbers: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for creating a phone number
  mcpServer.registerTool(
    'create-playground-phone-number',
    {
      title: 'Create playground phone number',
      description: 'Create a new phone number in the playground with default data',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33612345678)'),
      },
    },
    async ({ phoneNumber }) => {
      try {
        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33612345678)' }],
            isError: true,
          }
        }

        // Call API
        const result = await adminAction({ action: 'CREATE', phoneNumber })

        // Format response
        let response = `✅ **Phone Number Created**\n\n`
        response += `📞 **Phone Number**: ${phoneNumber}\n`

        if ('data' in result) {
          response += `\n📊 **Default Data Created**:\n`
          response += `  📡 **Reachability**: ${result.data.reachability.reachabilityStatus}\n`
          response += `  🌍 **Roaming**: ${result.data.roaming.roaming ? 'Yes' : 'No'}\n`
          response += `  📍 **Location**: Available: ${result.data.location.available}\n`
          response += `  🔄 **SIM Swap**: ${result.data.simSwap.latestSimChange}\n`
          response += `  👤 **KYC**: ${Object.keys(result.data.kyc).length} fields configured\n`
        }

        response += `\n🎯 **Next Steps**: Use update commands to modify the phone number data as needed.\n`

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] create-playground-phone-number error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to create phone number: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for reading phone number data
  mcpServer.registerTool(
    'read-playground-phone-number',
    {
      title: 'Read playground phone number data',
      description: 'Read all data associated with a phone number in the playground',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33612345678)'),
      },
    },
    async ({ phoneNumber }) => {
      try {
        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33612345678)' }],
            isError: true,
          }
        }

        // Call API
        const result = await adminAction({ action: 'READ', phoneNumber })

        // Format response
        let response = `📖 **Phone Number Data**\n\n`
        response += `📞 **Phone Number**: ${phoneNumber}\n\n`

        if ('data' in result) {
          const data = result.data

          // Reachability
          response += `📡 **Reachability Status**:\n`
          response += `  Status: ${data.reachability.reachabilityStatus}\n`
          if (data.reachability.lastStatusTime) {
            response += `  Last Status Time: ${data.reachability.lastStatusTime}\n`
          }
          response += `\n`

          // Roaming
          response += `🌍 **Roaming Status**:\n`
          response += `  Roaming: ${data.roaming.roaming ? 'Yes' : 'No'}\n`
          if (data.roaming.lastStatusTime) {
            response += `  Last Status Time: ${data.roaming.lastStatusTime}\n`
          }
          if (data.roaming.countryCode) {
            response += `  Country Code: ${data.roaming.countryCode}\n`
          }
          if (data.roaming.countryName && data.roaming.countryName.length > 0) {
            response += `  Country Name: ${data.roaming.countryName.join(', ')}\n`
          }
          response += `\n`

          // Location
          response += `📍 **Location**:\n`
          response += `  Available: ${data.location.available}\n`
          response += `  Last Location Time: ${data.location.lastLocationTime}\n`
          response += `  Latitude: ${data.location.latitude}\n`
          response += `  Longitude: ${data.location.longitude}\n`
          response += `  Radius: ${data.location.radius} meters\n`
          response += `\n`

          // SIM Swap
          response += `🔄 **SIM Swap**:\n`
          response += `  Latest SIM Change: ${data.simSwap.latestSimChange}\n`
          response += `\n`

          // KYC
          response += `👤 **KYC Data**:\n`
          if (data.kyc.name) response += `  Name: ${data.kyc.name}\n`
          if (data.kyc.givenName) response += `  Given Name: ${data.kyc.givenName}\n`
          if (data.kyc.familyName) response += `  Family Name: ${data.kyc.familyName}\n`
          if (data.kyc.email) response += `  Email: ${data.kyc.email}\n`
          if (data.kyc.birthdate) response += `  Birthdate: ${data.kyc.birthdate}\n`
          if (data.kyc.gender) response += `  Gender: ${data.kyc.gender}\n`
          if (data.kyc.address) response += `  Address: ${data.kyc.address}\n`
          if (data.kyc.country) response += `  Country: ${data.kyc.country}\n`

          const kycFields = Object.keys(data.kyc).filter(key => data.kyc[key as keyof typeof data.kyc])
          if (kycFields.length === 0) {
            response += `  No KYC data configured\n`
          }
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] read-playground-phone-number error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to read phone number data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for updating phone number location
  mcpServer.registerTool(
    'update-playground-phone-location',
    {
      title: 'Update playground phone number location',
      description: 'Update the location data for a phone number in the playground',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33612345678)'),
        latitude: z.number().min(-90).max(90).describe('Latitude (-90 to 90)'),
        longitude: z.number().min(-180).max(180).describe('Longitude (-180 to 180)'),
        radius: z.number().min(1).describe('Radius in meters'),
        available: z.boolean().optional().describe('Location availability (default: true)'),
        lastLocationTime: z.string().optional().describe('Last location time (ISO format, default: current time)'),
      },
    },
    async ({ phoneNumber, latitude, longitude, radius, available, lastLocationTime }) => {
      try {
        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33612345678)' }],
            isError: true,
          }
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90) {
          return {
            content: [{ type: 'text', text: '❌ Latitude must be between -90 and 90' }],
            isError: true,
          }
        }

        if (longitude < -180 || longitude > 180) {
          return {
            content: [{ type: 'text', text: '❌ Longitude must be between -180 and 180' }],
            isError: true,
          }
        }

        if (radius < 1) {
          return {
            content: [{ type: 'text', text: '❌ Radius must be at least 1 meter' }],
            isError: true,
          }
        }

        // Create update data
        const updateData = {
          location: {
            available: available ?? true,
            lastLocationTime: lastLocationTime || new Date().toISOString(),
            latitude,
            longitude,
            radius,
          },
        }

        // Call API
        const result = await adminAction({ action: 'UPDATE', phoneNumber, data: updateData })

        // Format response
        let response = `📍 **Location Updated**\n\n`
        response += `📞 **Phone Number**: ${phoneNumber}\n`
        response += `🌐 **New Location**:\n`
        response += `  Latitude: ${latitude}\n`
        response += `  Longitude: ${longitude}\n`
        response += `  Radius: ${radius} meters\n`
        response += `  Available: ${updateData.location.available}\n`
        response += `  Last Location Time: ${updateData.location.lastLocationTime}\n`

        if ('data' in result) {
          response += `\n✅ **Update successful!** Location data has been updated.\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] update-playground-phone-location error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to update phone number location: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for updating phone number KYC data
  mcpServer.registerTool(
    'update-playground-phone-kyc',
    {
      title: 'Update playground phone number KYC',
      description: 'Update the KYC (Know Your Customer) data for a phone number in the playground',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33612345678)'),
        name: z.string().optional().describe('Full name'),
        givenName: z.string().optional().describe('Given/first name'),
        familyName: z.string().optional().describe('Family/last name'),
        email: z.string().email().optional().describe('Email address'),
        birthdate: z.string().optional().describe('Birthdate (YYYY-MM-DD format)'),
        gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().describe('Gender'),
        address: z.string().optional().describe('Full address'),
        country: z.string().optional().describe('Country'),
      },
    },
    async ({ phoneNumber, name, givenName, familyName, email, birthdate, gender, address, country }) => {
      try {
        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33612345678)' }],
            isError: true,
          }
        }

        // Build KYC data (only include provided fields)
        const kycData: Record<string, string> = {}
        if (name) kycData.name = name
        if (givenName) kycData.givenName = givenName
        if (familyName) kycData.familyName = familyName
        if (email) kycData.email = email
        if (birthdate) kycData.birthdate = birthdate
        if (gender) kycData.gender = gender
        if (address) kycData.address = address
        if (country) kycData.country = country

        if (Object.keys(kycData).length === 0) {
          return {
            content: [{ type: 'text', text: '❌ At least one KYC field must be provided' }],
            isError: true,
          }
        }

        // Create update data
        const updateData = {
          kyc: kycData,
        }

        // Call API
        const result = await adminAction({ action: 'UPDATE', phoneNumber, data: updateData })

        // Format response
        let response = `👤 **KYC Data Updated**\n\n`
        response += `📞 **Phone Number**: ${phoneNumber}\n`
        response += `📝 **Updated KYC Fields**:\n`

        Object.entries(kycData).forEach(([key, value]) => {
          response += `  ${key}: ${value}\n`
        })

        if ('data' in result) {
          response += `\n✅ **Update successful!** KYC data has been updated.\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] update-playground-phone-kyc error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to update phone number KYC: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for deleting a phone number
  mcpServer.registerTool(
    'delete-playground-phone-number',
    {
      title: 'Delete playground phone number',
      description: 'Delete a phone number and all its data from the playground (WARNING: irreversible)',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33612345678)'),
        confirm: z.boolean().describe('Confirmation flag - must be true to proceed with deletion'),
      },
    },
    async ({ phoneNumber, confirm }) => {
      try {
        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33612345678)' }],
            isError: true,
          }
        }

        // Require confirmation
        if (!confirm) {
          return {
            content: [
              {
                type: 'text',
                text: '⚠️ **Deletion requires confirmation**\n\nTo delete this phone number, set the `confirm` parameter to `true`.\n\n**WARNING**: This action cannot be undone!',
              },
            ],
            isError: true,
          }
        }

        // Call API
        const result = await adminAction({ action: 'DELETE', phoneNumber })

        // Format response
        let response = `🗑️ **Phone Number Deleted**\n\n`
        response += `📞 **Phone Number**: ${phoneNumber}\n`
        response += `✅ **Status**: Successfully deleted from playground\n`
        response += `⚠️ **Note**: This action cannot be undone\n`

        if ('data' in result) {
          response += `\n📊 **Final Data** (for reference):\n`
          response += `  All associated data has been permanently removed\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] delete-playground-phone-number error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to delete phone number: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for updating phone number reachability status
  mcpServer.registerTool(
    'update-playground-phone-reachability',
    {
      title: 'Update playground phone number reachability',
      description: 'Update the reachability status for a phone number in the playground',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33612345678)'),
        reachabilityStatus: z
          .enum(['CONNECTED_DATA', 'CONNECTED_SMS', 'NOT_CONNECTED'])
          .describe('Reachability status'),
        lastStatusTime: z.string().optional().describe('Last status time (ISO format, default: current time)'),
      },
    },
    async ({ phoneNumber, reachabilityStatus, lastStatusTime }) => {
      try {
        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33612345678)' }],
            isError: true,
          }
        }

        // Create update data
        const updateData = {
          reachability: {
            reachabilityStatus,
            lastStatusTime: lastStatusTime || new Date().toISOString(),
          },
        }

        // Call API
        const result = await adminAction({ action: 'UPDATE', phoneNumber, data: updateData })

        // Format response
        let response = `📡 **Reachability Status Updated**\n\n`
        response += `📞 **Phone Number**: ${phoneNumber}\n`
        response += `📶 **New Reachability Status**: ${reachabilityStatus}\n`

        // Status description
        let statusDescription = ''
        switch (reachabilityStatus) {
          case 'CONNECTED_DATA':
            statusDescription = 'Connected via data (can receive SMS and data)'
            break
          case 'CONNECTED_SMS':
            statusDescription = 'Connected via SMS only (no data connection)'
            break
          case 'NOT_CONNECTED':
            statusDescription = 'Not connected to the network'
            break
        }

        response += `📋 **Description**: ${statusDescription}\n`
        response += `🕒 **Last Status Time**: ${updateData.reachability.lastStatusTime}\n`

        if ('data' in result) {
          response += `\n✅ **Update successful!** Reachability status has been updated.\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] update-playground-phone-reachability error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to update phone number reachability: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for updating phone number roaming status
  mcpServer.registerTool(
    'update-playground-phone-roaming',
    {
      title: 'Update playground phone number roaming',
      description: 'Update the roaming status for a phone number in the playground',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33612345678)'),
        roaming: z.boolean().describe('Roaming status (true if roaming, false if home network)'),
        countryCode: z.number().optional().describe('Country code (required if roaming is true)'),
        countryName: z.array(z.string()).optional().describe('Country name(s) (optional)'),
        lastStatusTime: z.string().optional().describe('Last status time (ISO format, default: current time)'),
      },
    },
    async ({ phoneNumber, roaming, countryCode, countryName, lastStatusTime }) => {
      try {
        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33612345678)' }],
            isError: true,
          }
        }

        // Validate roaming logic
        if (roaming && !countryCode) {
          return {
            content: [{ type: 'text', text: '❌ Country code is required when roaming is true' }],
            isError: true,
          }
        }

        // Create update data
        const updateData = {
          roaming: {
            roaming,
            lastStatusTime: lastStatusTime || new Date().toISOString(),
            ...(countryCode && { countryCode }),
            ...(countryName && countryName.length > 0 && { countryName }),
          },
        }

        // Call API
        const result = await adminAction({ action: 'UPDATE', phoneNumber, data: updateData })

        // Format response
        let response = `🌍 **Roaming Status Updated**\n\n`
        response += `📞 **Phone Number**: ${phoneNumber}\n`
        response += `📡 **Roaming**: ${roaming ? 'Yes (device is roaming)' : 'No (device is in home network)'}\n`

        if (countryCode) {
          response += `🏳️ **Country Code**: ${countryCode}\n`
        }

        if (countryName && countryName.length > 0) {
          response += `🌏 **Country Name**: ${countryName.join(', ')}\n`
        }

        response += `🕒 **Last Status Time**: ${updateData.roaming.lastStatusTime}\n`

        if ('data' in result) {
          response += `\n✅ **Update successful!** Roaming status has been updated.\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] update-playground-phone-roaming error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to update phone number roaming: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  // Tool for updating phone number SIM swap
  mcpServer.registerTool(
    'update-playground-phone-sim-swap',
    {
      title: 'Update playground phone number SIM swap',
      description: 'Update the SIM swap data for a phone number in the playground',
      inputSchema: {
        phoneNumber: z.string().describe('Phone number in E.164 format (e.g., +33612345678)'),
        latestSimChange: z
          .string()
          .describe('Latest SIM change timestamp (ISO format, e.g., 2024-01-01T12:00:00.000Z)'),
      },
    },
    async ({ phoneNumber, latestSimChange }) => {
      try {
        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Phone number is required and must be a string' }],
            isError: true,
          }
        }

        if (!phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +33612345678)' }],
            isError: true,
          }
        }

        // Validate date format
        if (!latestSimChange || typeof latestSimChange !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Latest SIM change timestamp is required and must be a string' }],
            isError: true,
          }
        }

        const simChangeDate = new Date(latestSimChange)
        if (isNaN(simChangeDate.getTime())) {
          return {
            content: [
              { type: 'text', text: '❌ Invalid date format. Use ISO format (e.g., 2024-01-01T12:00:00.000Z)' },
            ],
            isError: true,
          }
        }

        // Create update data
        const updateData = {
          simSwap: {
            latestSimChange,
          },
        }

        // Call API
        const result = await adminAction({ action: 'UPDATE', phoneNumber, data: updateData })

        // Format response
        let response = `🔄 **SIM Swap Updated**\n\n`
        response += `📞 **Phone Number**: ${phoneNumber}\n`
        response += `🔄 **Latest SIM Change**: ${latestSimChange}\n`

        // Calculate time difference for context
        const now = new Date()
        const diffMs = now.getTime() - simChangeDate.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

        if (diffMs > 0) {
          if (diffDays > 0) {
            response += `⏱️ **Time Ago**: ${diffDays} days ago\n`
          } else if (diffHours > 0) {
            response += `⏱️ **Time Ago**: ${diffHours} hours ago\n`
          } else {
            response += `⏱️ **Time Ago**: Less than 1 hour ago\n`
          }
        } else {
          response += `⏱️ **Time**: Future date (${Math.abs(diffDays)} days from now)\n`
        }

        if ('data' in result) {
          response += `\n✅ **Update successful!** SIM swap data has been updated.\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] update-playground-phone-sim-swap error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to update phone number SIM swap: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
