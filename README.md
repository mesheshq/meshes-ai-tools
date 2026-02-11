# meshes-ai-tools

AI tools for [Meshes](https://meshes.io) — Cursor rules, MCP server, and agent integrations for the Meshes event routing platform.

## What's inside

### [Cursor Rules](./cursor-rules/)

A drop-in `.mdc` rules file that teaches Cursor, Windsurf, and compatible AI coding editors how to use the Meshes API. Covers authentication, every endpoint, payload schemas, field mappings, multi-tenant patterns, and common mistakes to avoid.

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/meshes.mdc https://raw.githubusercontent.com/mesheshq/meshes-ai-tools/main/cursor-rules/meshes.mdc
```

### [MCP Server](./mcp-server/)

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI agents direct tool access to Meshes — emit events, manage workspaces, create rules, inspect deliveries, and more. Works with Claude Code, Claude Desktop, Cursor, and Windsurf.

```bash
cd mcp-server
npm install
npm run build
```

## Quick start

### Cursor Rules

Copy the rules file into your project and Cursor picks it up automatically:

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/meshes.mdc https://raw.githubusercontent.com/mesheshq/meshes-ai-tools/main/cursor-rules/meshes.mdc
```

### MCP Server

1. Clone and build:

```bash
git clone https://github.com/mesheshq/meshes-ai-tools.git
cd meshes-ai-tools/mcp-server
npm install
npm run build
```

2. Add to your MCP client (e.g., `~/.cursor/mcp.json`):

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
- [AI Tools Docs](https://meshes.io/docs/ai)

## License

MIT
