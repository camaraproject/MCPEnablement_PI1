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

import deviceLocationRetrieval from './device-location-retrieval'
import deviceLocationVerification from './device-location-verification'
import deviceReachabilityStatus from './device-reachability-status'
import deviceRoamingStatus from './device-roaming-status'
import kycMatch from './kyc-match'
import playgroundAdmin from './playground-admin'
import populationDensityData from './population-density-data'
import qosProfiles from './qos-profiles'
import qualityOnDemand from './quality-on-demand'
import simSwap from './sim-swap'

export const registerTools = (mcpServer: McpServer): void => {
  deviceLocationRetrieval(mcpServer)
  deviceLocationVerification(mcpServer)
  deviceReachabilityStatus(mcpServer)
  deviceRoamingStatus(mcpServer)
  kycMatch(mcpServer)
  playgroundAdmin(mcpServer)
  populationDensityData(mcpServer)
  qualityOnDemand(mcpServer)
  qosProfiles(mcpServer)
  simSwap(mcpServer)
}

export default registerTools

// export const registerTools = (mcpServer: McpServer): void => {
//   mcpServer.registerTool(
//     'echo',
//     {
//       title: 'Echo Tool',
//       description: 'Echoes back the provided message',
//       inputSchema: { message: z.string() },
//     },
//     async ({ message }) => ({
//       content: [{ type: 'text', text: `Tool echo: ${message}` }],
//     }),
//   )
// }

// export default registerTools
