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

import { performKYCMatch } from '../api/kyc-match'

export const registerTools = (mcpServer: McpServer): void => {
  mcpServer.registerTool(
    'kyc-match',
    {
      title: 'KYC Match',
      description: "Compare user information with verified data from the user's Operator for identity verification",
      inputSchema: {
        phoneNumber: z.string().optional().describe('Phone number in E.164 format (e.g., +34699901040)'),
        idDocument: z.string().optional().describe('ID number associated to the official identity document'),
        name: z.string().optional().describe('Complete name of the customer'),
        givenName: z.string().optional().describe('First/given name of the customer'),
        familyName: z.string().optional().describe('Last name, family name, or surname of the customer'),
        middleNames: z.string().optional().describe('Middle name/s of the customer'),
        familyNameAtBirth: z.string().optional().describe('Last/family/surname at birth of the customer'),
        address: z.string().optional().describe('Complete address of the customer'),
        streetName: z.string().optional().describe("Name of the street of the customer's address"),
        streetNumber: z.string().optional().describe("The street number of the customer's address"),
        postalCode: z.string().optional().describe('Zip code or postal code'),
        region: z.string().optional().describe("Region/prefecture of the customer's address"),
        locality: z.string().optional().describe("Locality of the customer's address"),
        country: z.string().optional().describe("Country of the customer's address (ISO 3166-1 alpha-2)"),
        houseNumberExtension: z
          .string()
          .optional()
          .describe('Specific identifier of the house (e.g., apartment number)'),
        birthdate: z.string().optional().describe('The birthdate of the customer (YYYY-MM-DD format)'),
        email: z.string().optional().describe('Email address of the customer'),
        gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().describe('Gender of the customer'),
      },
    },
    async params => {
      try {
        // Check that at least two parameters are provided
        const providedParams = Object.values(params).filter(value => value !== undefined && value !== '').length
        if (providedParams < 2) {
          return {
            content: [{ type: 'text', text: '❌ At least two parameters must be provided for KYC matching' }],
            isError: true,
          }
        }

        // Validate phone number format if provided
        if (params.phoneNumber && !params.phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid phone number format. Use E.164 format (e.g., +34699901040)' }],
            isError: true,
          }
        }

        // Validate birthdate format if provided
        if (params.birthdate && !params.birthdate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid birthdate format. Use YYYY-MM-DD format' }],
            isError: true,
          }
        }

        // Validate email format if provided
        if (params.email && !params.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid email format' }],
            isError: true,
          }
        }

        // Validate country format if provided (ISO 3166-1 alpha-2)
        if (params.country && !params.country.match(/^[A-Z]{2}$/i)) {
          return {
            content: [{ type: 'text', text: '❌ Invalid country format. Use ISO 3166-1 alpha-2 format (e.g., ES)' }],
            isError: true,
          }
        }

        // Call API
        const kycResult = await performKYCMatch(params)

        // Format response
        let response = `🔍 **KYC Match Results**\n\n`

        if (params.phoneNumber) {
          response += `📱 **Phone Number**: ${params.phoneNumber}\n`
        }

        response += `\n📊 **Match Results**:\n\n`

        const formatMatchResult = (label: string, match?: string, score?: number) => {
          if (match === undefined) return ''

          let icon = ''
          let status = ''

          switch (match) {
            case 'true':
              icon = '✅'
              status = 'Match'
              break
            case 'false':
              icon = '❌'
              status = 'No Match'
              break
            case 'not_available':
              icon = '⚪'
              status = 'Not Available'
              break
          }

          let result = `${icon} **${label}**: ${status}`
          if (score !== undefined && match === 'false') {
            result += ` (Score: ${score}%)`
          }
          result += '\n'

          return result
        }

        // Identity Information
        if (kycResult.idDocumentMatch !== undefined) {
          response += formatMatchResult('ID Document', kycResult.idDocumentMatch)
        }

        // Name Information
        if (kycResult.nameMatch !== undefined) {
          response += formatMatchResult('Name', kycResult.nameMatch, kycResult.nameMatchScore)
        }
        if (kycResult.givenNameMatch !== undefined) {
          response += formatMatchResult('Given Name', kycResult.givenNameMatch, kycResult.givenNameMatchScore)
        }
        if (kycResult.familyNameMatch !== undefined) {
          response += formatMatchResult('Family Name', kycResult.familyNameMatch, kycResult.familyNameMatchScore)
        }
        if (kycResult.middleNamesMatch !== undefined) {
          response += formatMatchResult('Middle Names', kycResult.middleNamesMatch, kycResult.middleNamesScore)
        }
        if (kycResult.familyNameAtBirthMatch !== undefined) {
          response += formatMatchResult(
            'Family Name at Birth',
            kycResult.familyNameAtBirthMatch,
            kycResult.familyNameAtBirthMatchScore,
          )
        }

        // Address Information
        if (kycResult.addressMatch !== undefined) {
          response += formatMatchResult('Address', kycResult.addressMatch, kycResult.addressMatchScore)
        }
        if (kycResult.streetNameMatch !== undefined) {
          response += formatMatchResult('Street Name', kycResult.streetNameMatch, kycResult.streetNameMatchScore)
        }
        if (kycResult.streetNumberMatch !== undefined) {
          response += formatMatchResult('Street Number', kycResult.streetNumberMatch, kycResult.streetNumberMatchScore)
        }
        if (kycResult.postalCodeMatch !== undefined) {
          response += formatMatchResult('Postal Code', kycResult.postalCodeMatch)
        }
        if (kycResult.regionMatch !== undefined) {
          response += formatMatchResult('Region', kycResult.regionMatch, kycResult.regionMatchScore)
        }
        if (kycResult.localityMatch !== undefined) {
          response += formatMatchResult('Locality', kycResult.localityMatch, kycResult.localityMatchScore)
        }
        if (kycResult.countryMatch !== undefined) {
          response += formatMatchResult('Country', kycResult.countryMatch)
        }
        if (kycResult.houseNumberExtensionMatch !== undefined) {
          response += formatMatchResult('House Number Extension', kycResult.houseNumberExtensionMatch)
        }

        // Personal Information
        if (kycResult.birthdateMatch !== undefined) {
          response += formatMatchResult('Birthdate', kycResult.birthdateMatch)
        }
        if (kycResult.emailMatch !== undefined) {
          response += formatMatchResult('Email', kycResult.emailMatch, kycResult.emailMatchScore)
        }
        if (kycResult.genderMatch !== undefined) {
          response += formatMatchResult('Gender', kycResult.genderMatch)
        }

        // Japanese name formats (always return 'not_available' according to documentation)
        if (kycResult.nameKanaHankakuMatch !== undefined) {
          response += formatMatchResult(
            'Name Kana Hankaku',
            kycResult.nameKanaHankakuMatch,
            kycResult.nameKanaHankakuMatchScore,
          )
        }
        if (kycResult.nameKanaZenkakuMatch !== undefined) {
          response += formatMatchResult(
            'Name Kana Zenkaku',
            kycResult.nameKanaZenkakuMatch,
            kycResult.nameKanaZenkakuMatchScore,
          )
        }

        response += `\n📝 **Note**: Match results show 'true' for exact matches, 'false' for non-matches (with similarity scores when available), and 'not_available' when the operator doesn't hold that information.`

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] kyc-match error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to perform KYC match: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
