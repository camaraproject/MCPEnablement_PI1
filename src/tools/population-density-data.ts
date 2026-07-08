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

import getPopulationDensityData from '../api/population-density-data'

export const registerTools = (mcpServer: McpServer): void => {
  mcpServer.registerTool(
    'get-population-density-data',
    {
      title: 'Get population density data',
      description: 'Retrieve population density estimations for a specified polygonal area and time interval',
      inputSchema: {
        boundary: z
          .array(
            z.object({
              latitude: z.number().min(-90).max(90),
              longitude: z.number().min(-180).max(180),
            }),
          )
          .min(3)
          .max(15)
          .describe('Array of points defining the polygon boundary (3-15 points)'),
        startTime: z.string().describe('Start date time in RFC 3339 format (e.g., 2024-04-23T14:44:18.165Z)'),
        endTime: z.string().describe('End date time in RFC 3339 format (e.g., 2024-04-23T14:44:18.165Z)'),
        precision: z
          .number()
          .min(1)
          .max(12)
          .optional()
          .describe('Precision level (geohash length) between 1-12, default is 7'),
      },
    },
    async ({ boundary, startTime, endTime, precision }) => {
      try {
        // Validate boundary array
        if (!boundary || !Array.isArray(boundary) || boundary.length < 3 || boundary.length > 15) {
          return {
            content: [{ type: 'text', text: '❌ Boundary must be an array of 3-15 points defining a polygon' }],
            isError: true,
          }
        }

        // Validate each point in boundary
        for (let i = 0; i < boundary.length; i++) {
          const point = boundary[i]
          if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
            return {
              content: [{ type: 'text', text: `❌ Point ${i + 1} must have valid latitude and longitude numbers` }],
              isError: true,
            }
          }
          if (point.latitude < -90 || point.latitude > 90) {
            return {
              content: [{ type: 'text', text: `❌ Point ${i + 1} latitude must be between -90 and 90` }],
              isError: true,
            }
          }
          if (point.longitude < -180 || point.longitude > 180) {
            return {
              content: [{ type: 'text', text: `❌ Point ${i + 1} longitude must be between -180 and 180` }],
              isError: true,
            }
          }
        }

        // Validate time strings
        if (!startTime || typeof startTime !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ Start time is required and must be a string in RFC 3339 format' }],
            isError: true,
          }
        }

        if (!endTime || typeof endTime !== 'string') {
          return {
            content: [{ type: 'text', text: '❌ End time is required and must be a string in RFC 3339 format' }],
            isError: true,
          }
        }

        // Validate precision if provided
        if (precision !== undefined && (precision < 1 || precision > 12 || !Number.isInteger(precision))) {
          return {
            content: [{ type: 'text', text: '❌ Precision must be an integer between 1 and 12' }],
            isError: true,
          }
        }

        // Validate time order
        const startDate = new Date(startTime)
        const endDate = new Date(endTime)
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return {
            content: [
              { type: 'text', text: '❌ Invalid date format. Use RFC 3339 format (e.g., 2024-04-23T14:44:18.165Z)' },
            ],
            isError: true,
          }
        }

        if (startDate >= endDate) {
          return {
            content: [{ type: 'text', text: '❌ End time must be after start time' }],
            isError: true,
          }
        }

        // Check if time period is not more than 7 days
        const timeDiff = endDate.getTime() - startDate.getTime()
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
        if (daysDiff > 7) {
          return {
            content: [{ type: 'text', text: '❌ Time period cannot be greater than 7 days' }],
            isError: true,
          }
        }

        // Create request object
        const request = {
          area: {
            areaType: 'POLYGON' as const,
            boundary: boundary,
          },
          startTime,
          endTime,
          precision: precision || 7,
        }

        // Call API
        const populationData = await getPopulationDensityData(request)

        // Format response
        let response = `🌍 **Population Density Data**\n\n`

        // Add area information
        response += `📍 **Area**: Polygon with ${boundary.length} points\n`
        response += `⏱️ **Time Period**: ${startTime} to ${endTime}\n`
        response += `🎯 **Precision Level**: ${precision || 7} (geohash length)\n`

        // Add status with appropriate emoji
        let statusEmoji = ''
        let statusDescription = ''

        switch (populationData.status) {
          case 'SUPPORTED_AREA':
            statusEmoji = '✅'
            statusDescription = 'The whole requested area is supported'
            break
          case 'PART_OF_AREA_NOT_SUPPORTED':
            statusEmoji = '🟡'
            statusDescription = 'Part of the requested area is outside coverage'
            break
          case 'AREA_NOT_SUPPORTED':
            statusEmoji = '❌'
            statusDescription = 'The whole requested area is outside coverage'
            break
          case 'OPERATION_NOT_COMPLETED':
            statusEmoji = '🔴'
            statusDescription = 'An error occurred during processing'
            break
          default:
            statusEmoji = '⚪'
            statusDescription = 'Unknown status'
        }

        response += `${statusEmoji} **Status**: ${populationData.status}\n`
        response += `📋 **Description**: ${statusDescription}\n`

        if (populationData.statusInfo) {
          response += `ℹ️ **Status Info**: ${populationData.statusInfo}\n`
        }

        response += `\n`

        // Add time interval data
        if (populationData.timedPopulationDensityData.length > 0) {
          response += `📊 **Population Density Data** (${populationData.timedPopulationDensityData.length} time intervals):\n\n`

          populationData.timedPopulationDensityData.forEach((timeData, index) => {
            response += `**Interval ${index + 1}**: ${timeData.startTime} to ${timeData.endTime}\n`

            const densityEstimations = timeData.cellPopulationDensityData.filter(
              cell => cell.dataType === 'DENSITY_ESTIMATION',
            )
            const lowDensityCells = timeData.cellPopulationDensityData.filter(cell => cell.dataType === 'LOW_DENSITY')
            const noDataCells = timeData.cellPopulationDensityData.filter(cell => cell.dataType === 'NO_DATA')

            response += `  📈 Cells with density data: ${densityEstimations.length}\n`
            response += `  🔽 Low density cells: ${lowDensityCells.length}\n`
            response += `  ❌ No data cells: ${noDataCells.length}\n`

            if (densityEstimations.length > 0) {
              const avgDensity = Math.round(
                densityEstimations.reduce((sum, cell) => sum + (cell.pplDensity || 0), 0) / densityEstimations.length,
              )
              const maxDensity = Math.max(...densityEstimations.map(cell => cell.pplDensity || 0))
              const minDensity = Math.min(...densityEstimations.map(cell => cell.pplDensity || 0))

              response += `  📊 Average density: ${avgDensity} people/km²\n`
              response += `  📈 Max density: ${maxDensity} people/km²\n`
              response += `  📉 Min density: ${minDensity} people/km²\n`
            }

            response += `\n`
          })

          // Show detailed cell data for first interval if available
          const firstInterval = populationData.timedPopulationDensityData[0]
          if (firstInterval && firstInterval.cellPopulationDensityData.length > 0) {
            response += `🔍 **Detailed Cell Data** (First interval):\n`
            const cellData = firstInterval.cellPopulationDensityData.slice(0, 5) // Show first 5 cells

            cellData.forEach((cell, index) => {
              response += `  **Cell ${index + 1}** (${cell.geohash}):\n`
              response += `    Type: ${cell.dataType}\n`
              if (cell.dataType === 'DENSITY_ESTIMATION') {
                response += `    Density: ${cell.pplDensity} people/km² (${cell.minPplDensity}-${cell.maxPplDensity})\n`
              }
            })

            if (firstInterval.cellPopulationDensityData.length > 5) {
              response += `  ... and ${firstInterval.cellPopulationDensityData.length - 5} more cells\n`
            }
          }
        } else {
          response += `📊 **Population Density Data**: No data available for the requested area\n`
        }

        return {
          content: [{ type: 'text', text: response }],
        }
      } catch (error) {
        console.error('[MCP Tool] get-population-density-data error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to get population density data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

export default registerTools
