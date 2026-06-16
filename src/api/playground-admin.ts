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
import './proxy.js'

import { fetch } from 'undici'

import globalConfig from '../config.js'

interface PlaygroundTokenResponse {
  token_type: 'Bearer'
  access_token: string
  expires_in: number
}

interface CachedPlaygroundToken {
  token: string
  expiresAt: number
}

const config = globalConfig.api
let cachedPlaygroundToken: CachedPlaygroundToken | undefined

const getPlaygroundAdminToken = async (): Promise<string> => {
  if (cachedPlaygroundToken && Date.now() < cachedPlaygroundToken.expiresAt) {
    return cachedPlaygroundToken.token
  }

  try {
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

    const response = await fetch('https://api.orange.com/oauth/v3/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(config.timeout),
    })

    if (!response.ok) {
      const errorText = await response.text()
      cachedPlaygroundToken = undefined
      throw new Error(`Playground OAuth token request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const tokenData: PlaygroundTokenResponse = (await response.json()) as PlaygroundTokenResponse

    const expiresIn = tokenData.expires_in || 3600
    cachedPlaygroundToken = {
      token: tokenData.access_token,
      expiresAt: Date.now() + (expiresIn - 60) * 1000, // 60 seconds buffer
    }

    console.error('[API Client] Successfully obtained playground admin access token')
    return tokenData.access_token
  } catch (error) {
    console.error('[API Client] Failed to get playground admin access token:', error)
    cachedPlaygroundToken = undefined
    throw new Error(
      `Failed to obtain playground admin access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error },
    )
  }
}

export interface ReachabilityStatusEntry {
  lastStatusTime?: string
  reachabilityStatus: 'CONNECTED_DATA' | 'CONNECTED_SMS' | 'NOT_CONNECTED'
}

export interface LocationEntry {
  available: boolean
  lastLocationTime: string
  latitude: number
  longitude: number
  radius: number
}

export interface RoamingStatusEntry {
  lastStatusTime?: string
  roaming: boolean
  countryCode?: number
  countryName?: string[]
}

export interface SimSwapEntry {
  latestSimChange: string
}

export interface KycEntry {
  idDocument?: string
  name?: string
  givenName?: string
  familyName?: string
  nameKanaHankaku?: string
  nameKanaZenkaku?: string
  middleNames?: string
  familyNameAtBirth?: string
  address?: string
  streetName?: string
  streetNumber?: string
  postalCode?: string
  region?: string
  locality?: string
  country?: string
  houseNumberExtension?: string
  birthdate?: string
  email?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
}

export interface EntryData {
  reachability: ReachabilityStatusEntry
  roaming: RoamingStatusEntry
  simSwap: SimSwapEntry
  location: LocationEntry
  kyc: KycEntry
}

export interface PartialEntryData {
  reachability?: ReachabilityStatusEntry
  roaming?: RoamingStatusEntry
  simSwap?: SimSwapEntry
  location?: LocationEntry
  kyc?: KycEntry
}

export interface AdminActionList {
  action: 'LIST'
}

export interface AdminActionCreate {
  action: 'CREATE'
  phoneNumber: string
}

export interface AdminActionUpdate {
  action: 'UPDATE'
  phoneNumber: string
  data: PartialEntryData
}

export interface AdminActionRead {
  action: 'READ'
  phoneNumber: string
}

export interface AdminActionDelete {
  action: 'DELETE'
  phoneNumber: string
}

export type AdminAction = AdminActionList | AdminActionCreate | AdminActionUpdate | AdminActionRead | AdminActionDelete

export interface ResponseList {
  phoneNumbers: string[]
}

export interface ResponseData {
  data: EntryData
}

export type AdminResponse = ResponseList | ResponseData

const adminAction = async (action: AdminAction): Promise<AdminResponse> => {
  try {
    const accessToken = await getPlaygroundAdminToken()

    const response = await fetch('https://api.orange.com/camara/playground/admin/v1.0/action', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
      signal: AbortSignal.timeout(config.timeout),
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

    const text = await response.text()
    const adminResponse: AdminResponse = text ? JSON.parse(text) : {}
    return adminResponse
  } catch (error) {
    console.error('[API Client] Failed to execute admin action:', error)
    throw new Error(`Failed to execute admin action: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export { adminAction }
export default { adminAction }
