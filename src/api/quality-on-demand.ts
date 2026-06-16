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

export interface ApplicationServer {
  ipv4Address?: string
  ipv6Address?: string
}

export interface PortsSpec {
  ranges?: Array<{
    from: number
    to: number
  }>
  ports?: number[]
}

export interface SinkCredential {
  credentialType: 'PLAIN' | 'ACCESSTOKEN' | 'REFRESHTOKEN'
  identifier?: string
  secret?: string
  accessToken?: string
  accessTokenExpiresUtc?: string
  accessTokenType?: 'bearer'
  refreshToken?: string
  refreshTokenEndpoint?: string
}

export interface CreateSessionRequest {
  device: Device
  applicationServer: ApplicationServer
  devicePorts?: PortsSpec
  applicationServerPorts?: PortsSpec
  qosProfile: string
  duration?: number
  sink?: string
  sinkCredential?: SinkCredential
}

export interface SessionInfo {
  sessionId: string
  device: Device
  applicationServer: ApplicationServer
  devicePorts?: PortsSpec
  applicationServerPorts?: PortsSpec
  qosProfile: string
  duration?: number
  startedAt: string
  expiresAt: string
  qosStatus: 'REQUESTED' | 'AVAILABLE' | 'UNAVAILABLE'
  statusInfo?: string
  sink?: string
  sinkCredential?: SinkCredential
}

export interface ExtendSessionRequest {
  requestedAdditionalDuration: number
}

export interface RetrieveSessionsRequest {
  device: Device
}

export const createSession = async (request: CreateSessionRequest): Promise<SessionInfo> => {
  try {
    // Validate required fields
    if (
      !request.device ||
      (!request.device.phoneNumber &&
        !request.device.networkAccessIdentifier &&
        !request.device.ipv4Address &&
        !request.device.ipv6Address)
    ) {
      throw new Error('Device with at least one identifier is required')
    }

    if (
      !request.applicationServer ||
      (!request.applicationServer.ipv4Address && !request.applicationServer.ipv6Address)
    ) {
      throw new Error('Application server with at least one IP address is required')
    }

    if (!request.qosProfile) {
      throw new Error('QoS profile is required')
    }

    // Validate device IPv4 address if provided
    if (request.device.ipv4Address) {
      const ipv4 = request.device.ipv4Address
      if (!ipv4.publicAddress) {
        throw new Error('Device IPv4 address must have a public address')
      }
      if (!ipv4.privateAddress && !ipv4.publicPort) {
        throw new Error('Device IPv4 address must have either private address or public port')
      }
    }

    // Validate phone number format if provided
    if (request.device.phoneNumber && !request.device.phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
      throw new Error('Invalid phone number format. Use E.164 format (e.g., +33699901032)')
    }

    const response = await makeRequest('/quality-on-demand/v0.11/sessions', {
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

    const session: SessionInfo = (await response.json()) as SessionInfo
    return session
  } catch (error) {
    console.error('[API Client] Failed to create QoS session:', error)
    throw new Error(`Failed to create QoS session: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export const getSession = async (sessionId: string): Promise<SessionInfo> => {
  try {
    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required and must be a string')
    }

    const response = await makeRequest(`/quality-on-demand/v0.11/sessions/${encodeURIComponent(sessionId)}`, {
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

    const session: SessionInfo = (await response.json()) as SessionInfo
    return session
  } catch (error) {
    console.error('[API Client] Failed to get QoS session:', error)
    throw new Error(`Failed to get QoS session: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required and must be a string')
    }

    const response = await makeRequest(`/quality-on-demand/v0.11/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
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

    // 204 No Content expected for successful deletion
  } catch (error) {
    console.error('[API Client] Failed to delete QoS session:', error)
    throw new Error(`Failed to delete QoS session: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export const extendSession = async (sessionId: string, request: ExtendSessionRequest): Promise<SessionInfo> => {
  try {
    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required and must be a string')
    }

    // Validate extension request
    if (!request.requestedAdditionalDuration || request.requestedAdditionalDuration <= 0) {
      throw new Error('Requested additional duration must be a positive number')
    }

    const response = await makeRequest(`/quality-on-demand/v0.11/sessions/${encodeURIComponent(sessionId)}/extend`, {
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

    const session: SessionInfo = (await response.json()) as SessionInfo
    return session
  } catch (error) {
    console.error('[API Client] Failed to extend QoS session:', error)
    throw new Error(`Failed to extend QoS session: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export const retrieveSessions = async (request: RetrieveSessionsRequest): Promise<SessionInfo[]> => {
  try {
    // Validate device
    if (
      !request.device ||
      (!request.device.phoneNumber &&
        !request.device.networkAccessIdentifier &&
        !request.device.ipv4Address &&
        !request.device.ipv6Address)
    ) {
      throw new Error('Device with at least one identifier is required')
    }

    // Validate phone number format if provided
    if (request.device.phoneNumber && !request.device.phoneNumber.match(/^\+[1-9][0-9]{4,14}$/)) {
      throw new Error('Invalid phone number format. Use E.164 format (e.g., +33699901032)')
    }

    const response = await makeRequest('/quality-on-demand/v0.11/retrieve-sessions', {
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

    const sessions: SessionInfo[] = (await response.json()) as SessionInfo[]
    return sessions
  } catch (error) {
    console.error('[API Client] Failed to retrieve QoS sessions:', error)
    throw new Error(`Failed to retrieve QoS sessions: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export default { createSession, getSession, deleteSession, extendSession, retrieveSessions }
