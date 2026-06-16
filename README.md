# MCP Enablement PI1 - Provider Implementation

This repository contains a Provider Implementation contributed by Orange in the context of the CAMARA MCP Enablement initiative of the [Commonalities Working Group](https://lf-camaraproject.atlassian.net/wiki/x/_QPe).

The repository is not a CAMARA API repository and does not define a normative CAMARA MCP specification. It hosts implementation material that can help explore and demonstrate how CAMARA APIs may be exposed through MCP-based tooling.

## Scope

This repository is intended to contain:

- implementation code for the Orange MCP server contribution;
- documentation of the supported capabilities, limitations, and assumptions;
- setup and usage instructions for running the implementation;
- implementation-specific issues and follow-up tasks.

The detailed functional scope is owned by the repository codeowners and should be documented here as the implementation is added.

## Implementation description

A Model Context Protocol (MCP) server that provides tools to interact with the Orange's Network APIs playground and administrative tools, which follows the Camara specifications. This server enables seamless integration with AI assistants, giving you access to various network capabilities including device location, roaming status, SIM swap detection, and playground administration.

###  Features

#### Network API Tools
- **Device Location Retrieval**: Get the location of a device
- **Device Location Verification**: Verify if a device is at a specific location
- **Device Reachability Status**: Check if a device is reachable on the network
- **Device Roaming Status**: Determine if a device is currently roaming
- **SIM Swap Detection**: Detect recent SIM swap events
- **Population Density Data**: Retrieve population density information for an area
- **KYC Match**: Compare user information with verified data from the operator for identity verification
- **QoS Profiles Management**: Retrieve and manage Quality of Service profiles with detailed performance characteristics
- **QoS Session Creation**: Create enhanced quality sessions between devices and application servers
- **QoS Session Management**: Get, extend, and terminate Quality of Service sessions
- **QoS Session Monitoring**: Retrieve all active QoS sessions for specific devices

#### Playground Administration
- **Phone Number Management**: List, add, and manage phone numbers in the playground
- **Configuration Tools**: Administrative tools for playground setup and management

### Installation & Usage

#### Prerequisites

- Node.js >= 24.0.0
- Yarn 4.x package manager (managed via Corepack)
- Valid Orange API credentials to https://developer.orange.com/apis/camara-playground

##### How to get Orange API Credentials

1. Visit the Orange Developer Portal: https://developer.orange.com/apis/camara-playground
2. Create an account or log in if you already have one
3. Subscribe to the CAMARA Playground API
4. Once subscribed, you'll receive your `CLIENT_ID` and `CLIENT_SECRET`
5. These credentials will be needed for the MCP server configuration

#### Setup

1. Clone the repository

2. Enable Corepack (if not already enabled):
   ```bash
   corepack enable
   ```
   
   This will activate Corepack, which manages the Yarn version specified in `package.json`. The project uses Yarn 4.13.0, which will be automatically downloaded and used.

3. Install dependencies:
   ```bash
   yarn install
   ```

4. Build the project
   ```bash
   yarn build
   ```

#### AI assitant configuration

Once built you can use the mcp server with any mcp compatible ai assistant (e.g. [Cline](https://cline.bot/), [MCPJam](https://www.mcpjam.com/), [Goose](https://github.com/aaif-goose/goose), ...).
The exact configuration depends on the assistant you use.

##### Generic configuration
Use the following command:

```bash
node /absolute/path/to/project/dist/index.js
```

Make sure to set the required environment variables:
- `CLIENT_ID`: Your Orange API client ID
- `CLIENT_SECRET`: Your Orange API client secret

##### Claude Desktop Configuration

Add the following configuration to your Claude Desktop MCP settings file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "orange-network-api": {
      "command": "node",
      "args": ["/absolute/path/to/project/dist/index.js"],
      "env": {
        "CLIENT_ID": "your_client_id",
        "CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

#### Sample prompts

Once your AI assistant is configured you can start to prompt. You will find some examples in the prompts folder.

Note that you will need to first create some fake phone numbers as indicated in the [init prompt file](./prompts/init.md).

## Contibuting

Discussions and coordination for this Provider Implementation should use the Commonalities Working Group mailing list:

- Subscribe / unsubscribe: https://lists.camaraproject.org/g/wg-commonalities
- Mailing list address: wg-commonalities@lists.camaraproject.org

Repository-specific work should be tracked with GitHub issues in this repository.


### Prerequisites

- Node.js >= 24.0.0
- Yarn 4.x package manager (managed via Corepack)
- Valid Orange API credentials to https://developer.orange.com/apis/camara-playground

### Setup

1. Clone the repository

2. Enable Corepack (if not already enabled):
   ```bash
   corepack enable
   ```
   
   This will activate Corepack, which manages the Yarn version specified in `package.json`. The project uses Yarn 4.13.0, which will be automatically downloaded and used.

3. Install dependencies:
   ```bash
   yarn install
   ```

4. Create a `.env` file with your configuration:
   ```env
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   ```

### Available Scripts

- **Install dependencies**: `yarn install`
- **Build the project**: `yarn build`
- **Build in watch mode**: `yarn build:watch`
- **Run linter**: `yarn lint`
- **Type checking**: `yarn type-check`
- **Run inspector**: `yarn inspector`
- **List dependency licenses**: `yarn licenses`

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes in the `src` directory
3. Run the linter to check code quality:
   ```bash
   yarn lint
   ```
4. Build the project:
   ```bash
   yarn build
   ```
5. Test your changes using the inspector:
   ```bash
   yarn inspector
   ```

### Testing with MCP Clients During Development

You can configure MCP-compatible applications to use your local build for testing:

1. Build the project first:
   ```bash
   yarn build
   ```

2. Configure your MCP client to use the local build with the absolute path:
   ```bash
   node /absolute/path/to/project/dist/index.js
   ```

3. Make sure to set the required environment variables in your MCP client configuration or export them in your shell:
   ```bash
   export CLIENT_ID="your_client_id"
   export CLIENT_SECRET="your_client_secret"
   ```

### Project Structure

```
src/
├── api/                # API client implementations
├── tools/              # MCP tool implementations
├── prompts/            # MCP prompt implementations
├── resources/          # MCP resource implementations
├── config.ts           # Configuration management
└── index.ts            # Main server entry point
```

### Configuration

The server can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CLIENT_ID` | Orange API client ID | Required |
| `CLIENT_SECRET` | Orange API client secret | Required |
| `API_BASE_URL` | Base URL for Orange API | `https://api.orange.com/camara/playground` |
| `API_TIMEOUT` | Request timeout in milliseconds | `30000` |
| `API_RETRIES` | Number of retry attempts | `3` |
| `HTTP_PROXY` | HTTP proxy URL | — |
| `HTTPS_PROXY` | HTTPS proxy URL | — |
| `NO_PROXY` | Comma-separated list of hosts to bypass proxy | — |
