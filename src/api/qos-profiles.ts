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
  phoneNumber?: string
  networkAccessIdentifier?: string
  ipv4Address?: DeviceIpv4Addr
  ipv6Address?: string
}

export interface DeviceIpv4Addr {
  publicAddress: string
  privateAddress?: string
  publicPort?: number
}

export interface Rate {
  value: number
  unit: 'Kbps' | 'Mbps' | 'Gbps' | 'Tbps'
}

export interface Duration {
  value: number
  unit: 'Nanoseconds' | 'Microseconds' | 'Milliseconds' | 'Seconds' | 'Minutes' | 'Hours' | 'Days'
}

export interface QosProfile {
  name: string
  description: string
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
  targetMinUpstreamRate?: Rate
  maxUpstreamRate?: Rate
  maxUpstreamBurstRate?: Rate
  targetMinDownstreamRate?: Rate
  maxDownstreamRate?: Rate
  maxDownstreamBurstRate?: Rate
  minDuration?: Duration
  maxDuration?: Duration
  priority?: number
  packetDelayBudget?: Duration
  jitter?: Duration
  packetErrorLossRate?: number
}

export interface QosProfileDeviceRequest {
  device?: Device
  name?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
}

export const retrieveQosProfiles = async (request?: QosProfileDeviceRequest): Promise<QosProfile[]> => {
  try {
    const requestBody = request || {}

    const response = await makeRequest('/qos-profiles/v0.11/retrieve-qos-profiles', {
      method: 'POST',
      body: JSON.stringify(requestBody),
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

    const profiles: QosProfile[] = (await response.json()) as QosProfile[]
    return profiles
  } catch (error) {
    console.error('[API Client] Failed to retrieve QoS profiles:', error)
    throw new Error(`Failed to retrieve QoS profiles: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export const getQosProfile = async (name: string): Promise<QosProfile> => {
  try {
    // Validate profile name format
    if (!name || typeof name !== 'string') {
      throw new Error('Profile name is required and must be a string')
    }

    const response = await makeRequest(`/qos-profiles/v0.11/qos-profiles/${encodeURIComponent(name)}`, {
      method: 'GET',
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

    const profile: QosProfile = (await response.json()) as QosProfile
    return profile
  } catch (error) {
    console.error('[API Client] Failed to get QoS profile:', error)
    throw new Error(`Failed to get QoS profile: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export default { retrieveQosProfiles, getQosProfile }
