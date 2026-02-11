# Meshes MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets AI agents interact with the [Meshes](https://meshes.io) event routing platform.

## What is Meshes?

Meshes is a universal integration layer for SaaS applications. Emit product events (signups, payments, form submissions, etc.) once, and Meshes routes them to CRMs, email tools, webhooks, and more — with retries, fan-out, field mappings, and multi-tenant isolation built in.

**Supported integrations:** ActiveCampaign, AWeber, HubSpot, Intercom, Mailchimp, MailerLite, Resend, Salesforce, Webhooks, Zoom

## What can AI agents do with this?

With this MCP server, an AI coding agent (Cursor, Claude Code, Windsurf, etc.) can:

- **Emit events** to Meshes (single or bulk up to 100)
- **Manage workspaces** — create, update, list, and inspect (including publishable keys)
- **Manage connections** — create/update/delete destinations, inspect available actions and field catalogs
- **Manage rules** — create routing rules that bind events to connections with action metadata
- **Debug deliveries** — inspect event status, view payloads, check per-rule delivery attempts, and retry failures
- **Discover integrations** — list all supported integration types with their auth methods and available actions

## Quick Start

### 1. Install & Build

```bash
npm install
npm run build
```

### 2. Configure

The server needs your Meshes machine key credentials. It automatically mints short-lived JWTs for each API request. See [Authentication](https://meshes.io/docs/api/authentication) for details.

You'll need three values from your Meshes dashboard (Settings > Machine Keys):

```bash
export MESHES_ACCESS_KEY=your_access_key
export MESHES_SECRET_KEY=your_secret_key
export MESHES_ORG_ID=your_organization_uuid
```

### 3. Add to your MCP client

**Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "meshes": {
      "command": "node",
      "args": ["/path/to/meshes-mcp-server/dist/index.js"],
      "env": {
        "MESHES_ACCESS_KEY": "your_access_key",
        "MESHES_SECRET_KEY": "your_secret_key",
        "MESHES_ORG_ID": "your_organization_uuid"
      }
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "meshes": {
      "command": "node",
      "args": ["/path/to/meshes-mcp-server/dist/index.js"],
      "env": {
        "MESHES_ACCESS_KEY": "your_access_key",
        "MESHES_SECRET_KEY": "your_secret_key",
        "MESHES_ORG_ID": "your_organization_uuid"
      }
    }
  }
}
```

**Claude Code**:

```bash
claude mcp add meshes node /path/to/meshes-mcp-server/dist/index.js \
  -e MESHES_ACCESS_KEY=your_access_key \
  -e MESHES_SECRET_KEY=your_secret_key \
  -e MESHES_ORG_ID=your_organization_uuid
```

## Available Tools (22 tools)

### Workspaces

| Tool                               | Description                                        |
| ---------------------------------- | -------------------------------------------------- |
| `meshes_list_workspaces`           | List all workspaces                                |
| `meshes_get_workspace`             | Get workspace details + publishable key            |
| `meshes_create_workspace`          | Create a new workspace                             |
| `meshes_update_workspace`          | Update workspace name/description                  |
| `meshes_get_workspace_connections` | List connections in a workspace                    |
| `meshes_get_workspace_rules`       | List rules in a workspace                          |
| `meshes_get_workspace_events`      | List events with filters (event, status, resource) |

### Connections

| Tool                                     | Description                               |
| ---------------------------------------- | ----------------------------------------- |
| `meshes_list_connections`                | List all connections org-wide             |
| `meshes_get_connection`                  | Get connection details                    |
| `meshes_create_connection`               | Create a new connection                   |
| `meshes_update_connection`               | Update connection name/metadata           |
| `meshes_delete_connection`               | Delete connection (supports force_delete) |
| `meshes_get_connection_actions`          | Discover available actions                |
| `meshes_get_connection_fields`           | Get destination field catalog             |
| `meshes_get_connection_default_mappings` | Get field mapping configuration           |

### Rules

| Tool                 | Description                      |
| -------------------- | -------------------------------- |
| `meshes_list_rules`  | List rules with optional filters |
| `meshes_get_rule`    | Get rule details                 |
| `meshes_create_rule` | Create a routing rule            |
| `meshes_delete_rule` | Delete a rule                    |

### Events

| Tool                       | Description                 |
| -------------------------- | --------------------------- |
| `meshes_emit_event`        | Emit a single event         |
| `meshes_emit_bulk_events`  | Emit up to 100 events       |
| `meshes_list_events`       | List events with pagination |
| `meshes_get_event`         | Get event + delivery status |
| `meshes_get_event_payload` | Get event + full payload    |
| `meshes_retry_event_rule`  | Retry a failed delivery     |

### Integrations

| Tool                       | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| `meshes_list_integrations` | Discover all integration types and their capabilities |

## Example Agent Conversations

**"Set up a signup event that goes to HubSpot"**

1. `meshes_list_workspaces` → find the workspace
2. `meshes_get_workspace_connections` → find the HubSpot connection
3. `meshes_get_connection_actions` → discover available actions
4. `meshes_create_rule` → create rule: `user.signup` → HubSpot → `create_or_update_contact`

**"Why didn't my payment.failed event reach Salesforce?"**

1. `meshes_get_workspace_events` → filter by `event=payment.failed&status=failed`
2. `meshes_get_event` → inspect rule_events for error details
3. `meshes_get_event_payload` → check what payload was sent
4. `meshes_retry_event_rule` → retry after fixing the issue

**"What integrations can I connect?"**

1. `meshes_list_integrations` → see all types with auth methods and actions

## API Reference

This MCP server is built against the [Meshes OpenAPI specification](https://docs.meshes.dev).

- **Base URL:** `https://api.meshes.io`
- **Auth:** Machine key credentials (access key + secret key + org ID) — the server mints short-lived JWTs automatically
- **SDKs:** `@mesheshq/api` (management) and `@mesheshq/events` (event ingestion)

## Development

```bash
npm run dev          # Run with tsx (hot reload)
npm run build        # Compile TypeScript
npm start            # Run compiled JS

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
