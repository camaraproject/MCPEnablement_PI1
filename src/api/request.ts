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
import './proxy.ts'

import { fetch, type RequestInit as UndiciRequestInit, type Response as UndiciResponse } from 'undici'

import globalConfig from '../config.ts'

interface OAuthTokenResponse {
  token_type: string
  access_token: string
  expires_in: string
}

interface CachedToken {
  token: string
  expiresAt: number // 60 seconds buffer
}

const config = globalConfig.api
let cachedToken: CachedToken | undefined

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  try {
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

    const response = await fetch('https://api.orange.com/openidconnect/playground/v1.0/token', {
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
      cachedToken = undefined
      throw new Error(`OAuth token request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const tokenData: OAuthTokenResponse = (await response.json()) as OAuthTokenResponse

    const expiresIn = parseInt(tokenData.expires_in) || 3600
    cachedToken = {
      token: tokenData.access_token,
      expiresAt: Date.now() + (expiresIn - 60) * 1000, // 60 seconds buffer
    }

    console.error('[API Client] Successfully obtained access token')
    return tokenData.access_token
  } catch (error) {
    console.error('[API Client] Failed to get access token:', error)
    cachedToken = undefined
    throw new Error(`Failed to obtain access token: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

const makeRequest = async (endpoint: string, options: UndiciRequestInit = {}): Promise<UndiciResponse> => {
  const url = `${config.baseUrl}/api${endpoint}`
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      // Get fresh access token for each request
      const accessToken = await getAccessToken()

      const requestOptions: UndiciRequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'orange-playground-mcp-server',
          ...options.headers,
        },
        signal: AbortSignal.timeout(config.timeout),
      }

      console.error(`[API Client] Making request to ${url} (attempt ${attempt}/${config.retries})`)

      const response = await fetch(url, requestOptions)

      // If successful or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      // Server error (5xx), retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`[API Client] Request failed (attempt ${attempt}/${config.retries}):`, lastError.message)
    }

    // Wait before retrying (exponential backoff)
    if (attempt < config.retries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      console.error(`[API Client] Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error(`Request failed after ${config.retries} retries`)
}

export default makeRequest
