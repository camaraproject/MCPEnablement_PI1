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

export interface SimSwapDateRequest {
  phoneNumber?: string
}

export interface SimSwapCheckRequest {
  phoneNumber?: string
  maxAge?: number
}

export interface SimSwapDateResponse {
  latestSimChange: string | null
}

export interface SimSwapCheckResponse {
  swapped: boolean
}

const getSimSwapDate = async (phoneNumber: string): Promise<SimSwapDateResponse> => {
  try {
    const request: SimSwapDateRequest = {
      phoneNumber,
    }

    const response = await makeRequest('/sim-swap/v1/retrieve-date', {
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

    const simSwapInfo: SimSwapDateResponse = (await response.json()) as SimSwapDateResponse
    return simSwapInfo
  } catch (error) {
    console.error('[API Client] Failed to get SIM swap date:', error)
    throw new Error(`Failed to get SIM swap date: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

const checkSimSwap = async (phoneNumber: string, maxAge?: number): Promise<SimSwapCheckResponse> => {
  try {
    const request: SimSwapCheckRequest = {
      phoneNumber,
    }

    if (maxAge !== undefined) {
      request.maxAge = maxAge
    }

    const response = await makeRequest('/sim-swap/v1/check', {
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

    const simSwapCheck: SimSwapCheckResponse = (await response.json()) as SimSwapCheckResponse
    return simSwapCheck
  } catch (error) {
    console.error('[API Client] Failed to check SIM swap:', error)
    throw new Error(`Failed to check SIM swap: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export { getSimSwapDate, checkSimSwap }
export default { getSimSwapDate, checkSimSwap }
