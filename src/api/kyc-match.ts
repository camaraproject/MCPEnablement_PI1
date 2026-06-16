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

export interface KYCMatchRequest {
  phoneNumber?: string
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

export interface KYCMatchResponse {
  idDocumentMatch?: 'true' | 'false' | 'not_available'
  nameMatch?: 'true' | 'false' | 'not_available'
  nameMatchScore?: number
  givenNameMatch?: 'true' | 'false' | 'not_available'
  givenNameMatchScore?: number
  familyNameMatch?: 'true' | 'false' | 'not_available'
  familyNameMatchScore?: number
  nameKanaHankakuMatch?: 'true' | 'false' | 'not_available'
  nameKanaHankakuMatchScore?: number
  nameKanaZenkakuMatch?: 'true' | 'false' | 'not_available'
  nameKanaZenkakuMatchScore?: number
  middleNamesMatch?: 'true' | 'false' | 'not_available'
  middleNamesScore?: number
  familyNameAtBirthMatch?: 'true' | 'false' | 'not_available'
  familyNameAtBirthMatchScore?: number
  addressMatch?: 'true' | 'false' | 'not_available'
  addressMatchScore?: number
  streetNameMatch?: 'true' | 'false' | 'not_available'
  streetNameMatchScore?: number
  streetNumberMatch?: 'true' | 'false' | 'not_available'
  streetNumberMatchScore?: number
  postalCodeMatch?: 'true' | 'false' | 'not_available'
  regionMatch?: 'true' | 'false' | 'not_available'
  regionMatchScore?: number
  localityMatch?: 'true' | 'false' | 'not_available'
  localityMatchScore?: number
  countryMatch?: 'true' | 'false' | 'not_available'
  houseNumberExtensionMatch?: 'true' | 'false' | 'not_available'
  birthdateMatch?: 'true' | 'false' | 'not_available'
  emailMatch?: 'true' | 'false' | 'not_available'
  emailMatchScore?: number
  genderMatch?: 'true' | 'false' | 'not_available'
}

const performKYCMatch = async (request: KYCMatchRequest): Promise<KYCMatchResponse> => {
  try {
    const response = await makeRequest('/kyc-match/v0.2/match', {
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

    const kycResult: KYCMatchResponse = (await response.json()) as KYCMatchResponse
    return kycResult
  } catch (error) {
    console.error('[API Client] Failed to perform KYC match:', error)
    throw new Error(`Failed to perform KYC match: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      cause: error,
    })
  }
}

export { performKYCMatch }
export default { performKYCMatch }
