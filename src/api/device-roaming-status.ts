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
import makeRequest from './request.js'

export interface RoamingStatusResponse {
  lastStatusTime?: string
  roaming: boolean
  countryCode?: number
  countryName?: string[]
}

const getDeviceRoamingStatus = async (phoneNumber: string): Promise<RoamingStatusResponse> => {
  try {
    const request = { device: { phoneNumber } }

    const response = await makeRequest('/device-roaming-status/v0.6/retrieve', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await (response.json() as Promise<{ status?: number; code?: string; message?: string }>).catch(
        () => ({
          status: response.status,
          code: 'UNKNOWN_ERROR',
          message: response.statusText,
        }),
      )
      throw new Error(`API Error ${errorData.status}: ${errorData.code} - ${errorData.message}`)
    }

    const roamingStatus: RoamingStatusResponse = (await response.json()) as RoamingStatusResponse
    return roamingStatus
  } catch (error) {
    console.error('[API Client] Failed to get roaming status:', error)
    throw new Error(`Failed to get roaming status: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export default getDeviceRoamingStatus
