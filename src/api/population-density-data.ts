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

export interface Point {
  latitude: number
  longitude: number
}

export interface Polygon {
  areaType: 'POLYGON'
  boundary: Point[]
}

export type Area = Polygon

export interface PopulationDensityRequest {
  area: Area
  startTime: string
  endTime: string
  precision?: number
}

export interface CellPopulationDensityData {
  geohash: string
  dataType: 'NO_DATA' | 'LOW_DENSITY' | 'DENSITY_ESTIMATION'
  maxPplDensity?: number
  minPplDensity?: number
  pplDensity?: number
}

export interface TimedPopulationDensityData {
  startTime: string
  endTime: string
  cellPopulationDensityData: CellPopulationDensityData[]
}

export interface PopulationDensityResponse {
  timedPopulationDensityData: TimedPopulationDensityData[]
  status: 'SUPPORTED_AREA' | 'PART_OF_AREA_NOT_SUPPORTED' | 'AREA_NOT_SUPPORTED' | 'OPERATION_NOT_COMPLETED'
  statusInfo?: string
}

const getPopulationDensityData = async (request: PopulationDensityRequest): Promise<PopulationDensityResponse> => {
  try {
    const response = await makeRequest('/population-density-data/v0.3/retrieve', {
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

    const populationData: PopulationDensityResponse = (await response.json()) as PopulationDensityResponse
    return populationData
  } catch (error) {
    console.error('[API Client] Failed to get population density data:', error)
    throw new Error(
      `Failed to get population density data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error },
    )
  }
}

export default getPopulationDensityData
