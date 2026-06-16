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
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici'

const hasProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy

if (hasProxy) {
  setGlobalDispatcher(new EnvHttpProxyAgent())
  const proxyUrl =
    process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy
  console.error(`[API Client] Proxy enabled: ${proxyUrl}`)
}
