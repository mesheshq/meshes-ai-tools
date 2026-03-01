# meshes-ai-tools

AI tools for [Meshes](https://meshes.io) — Cursor rules and agent integrations for the Meshes event routing platform.

## What's inside

### [Cursor Rules](./cursor-rules/)

A drop-in `.mdc` rules file that teaches Cursor, Windsurf, and compatible AI coding editors how to use the Meshes API. Covers authentication, every endpoint, payload schemas, field mappings, multi-tenant patterns, and common mistakes to avoid.

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/meshes.mdc https://raw.githubusercontent.com/mesheshq/meshes-ai-tools/refs/heads/main/.cursor/rules/meshes.mdc
```

### [MCP Server (Official)](https://github.com/mesheshq/meshes-mcp-server)

The official [Model Context Protocol](https://modelcontextprotocol.io) server for Meshes lives in the standalone repo above. It gives AI agents direct tool access to Meshes — emit events, manage workspaces, create rules, inspect deliveries, and more. Works with Claude Code, Claude Desktop, Cursor, and Windsurf.

```bash
claude mcp add meshes \
  -e MESHES_ACCESS_KEY=your_access_key \
  -e MESHES_SECRET_KEY=your_secret_key \
  -e MESHES_ORG_ID=your_org_id \
  -- npx -y @mesheshq/mcp-server
```

Fallback copy in this repo: [`./mcp-server/`](./mcp-server/).

## Quick start

### Cursor Rules

Copy the rules file into your project and Cursor picks it up automatically:

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/meshes.mdc https://raw.githubusercontent.com/mesheshq/meshes-ai-tools/refs/heads/main/.cursor/rules/meshes.mdc
```

### MCP Server

1. Add the official server to your MCP client (e.g., `~/.cursor/mcp.json`):

> **Security note:** This config file contains your secret key. It lives in your home directory (`~/.cursor/mcp.json`), not your project repo, so it won't be accidentally committed. Never commit access keys or secret keys to version control. Publishable keys are safe to commit.

```json
{
  "mcpServers": {
    "meshes": {
      "command": "npx",
      "args": ["-y", "@mesheshq/mcp-server"],
      "env": {
        "MESHES_ACCESS_KEY": "your_access_key",
        "MESHES_SECRET_KEY": "your_secret_key",
        "MESHES_ORG_ID": "your_organization_uuid"
      }
    }
  }
}
```

2. Optional fallback: run from this repo copy (`./mcp-server/`) instead of npm package:

```bash
cd mcp-server
npm install
npm run build
```

Then set your MCP server config to:

```json
{
  "mcpServers": {
    "meshes": {
      "command": "node",
      "args": ["/path/to/meshes-ai-tools/mcp-server/dist/index.js"],
      "env": {
        "MESHES_ACCESS_KEY": "your_access_key",
        "MESHES_SECRET_KEY": "your_secret_key",
        "MESHES_ORG_ID": "your_organization_uuid"
      }
    }
  }
}
```

Find your credentials in the Meshes dashboard under Settings > Machine Keys.

## What is Meshes?

[Meshes](https://meshes.io) is a universal integration layer for SaaS applications. Emit product events once — signups, payments, form submissions — and Meshes routes them to CRMs, email tools, webhooks, and more with retries, fan-out, field mappings, and multi-tenant isolation built in.

Supported integrations: ActiveCampaign, AWeber, HubSpot, Intercom, Mailchimp, MailerLite, Resend, Salesforce, Webhooks, Zoom.

## Documentation

- [Meshes Docs](https://meshes.io/docs)
- [API Reference](https://docs.meshes.dev)
- [Authentication](https://meshes.io/docs/api/authentication)
- [AI Tools Docs](https://meshes.io/docs/ai/ai)
- [MCP Server Docs](https://meshes.io/docs/ai/mcp-server)
- [Official MCP Server Repo](https://github.com/mesheshq/meshes-mcp-server)

## License

These tools are provided for use with the Meshes platform.
See [meshes.io/terms-of-service](https://meshes.io/terms-of-service) for terms of use.
