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

export interface Device {
  phoneNumber: string
}

export interface Point {
  latitude: number
  longitude: number
}

export interface Circle {
  areaType: 'CIRCLE'
  center: Point
  radius: number
}

export interface Polygon {
  areaType: 'POLYGON'
  boundary: Point[]
}

export type Area = Circle | Polygon

export interface LocationResponse {
  lastLocationTime: string
  area: Area
}

export interface LocationRequest {
  device: Device
  maxAge?: number
}

const getDeviceLocation = async (phoneNumber: string, maxAge?: number): Promise<LocationResponse> => {
  try {
    const request: LocationRequest = {
      device: { phoneNumber },
    }

    if (maxAge !== undefined) {
      request.maxAge = maxAge
    }

    const response = await makeRequest('/location-retrieval/v0.3/retrieve', {
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

    const location: LocationResponse = (await response.json()) as LocationResponse
    return location
  } catch (error) {
    console.error('[API Client] Failed to get device location:', error)
    throw new Error(`Failed to get device location: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export default getDeviceLocation
