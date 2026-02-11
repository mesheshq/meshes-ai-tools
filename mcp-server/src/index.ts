import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MeshesApiClient } from "./api-client.js";
import type {
  IntegrationType,
  EventStatus,
  RuleMetadata,
} from "./api-client.js";

// ── Configuration ─────────────────────────────────────────────
// Authentication uses short-lived HS256 JWTs minted from your
// Meshes machine key credentials. The server generates a fresh
// token for each API request (tokens expire in 30 seconds).
// See: https://meshes.io/docs/api/authentication

const ACCESS_KEY = process.env.MESHES_ACCESS_KEY;
const SECRET_KEY = process.env.MESHES_SECRET_KEY;
const ORG_ID = process.env.MESHES_ORG_ID;
const BASE_URL = process.env.MESHES_BASE_URL || "https://api.meshes.io";

if (!ACCESS_KEY || !SECRET_KEY || !ORG_ID) {
  console.error(
    "Missing required environment variables:\n" +
      "  MESHES_ACCESS_KEY  — your machine key access key\n" +
      "  MESHES_SECRET_KEY  — your machine key secret\n" +
      "  MESHES_ORG_ID      — your organization UUID\n\n" +
      "Find these in the Meshes dashboard under Settings > Machine Keys.\n" +
      "See: https://meshes.io/docs/api/authentication"
  );
  process.exit(1);
}

const client = new MeshesApiClient({
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  orgId: ORG_ID,
  baseUrl: BASE_URL,
});

const INTEGRATION_TYPES = [
  "activecampaign",
  "aweber",
  "hubspot",
  "intercom",
  "mailchimp",
  "mailerlite",
  "resend",
  "salesforce",
  "webhook",
  "zoom",
] as const;

const EVENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

// Helper for consistent error handling
function toolError(error: unknown): {
  isError: true;
  content: [{ type: "text"; text: string }];
} {
  const msg = error instanceof Error ? error.message : String(error);
  return { isError: true, content: [{ type: "text" as const, text: msg }] };
}

function toolOk(data: unknown): { content: [{ type: "text"; text: string }] } {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

// ── Server ────────────────────────────────────────────────────

const server = new McpServer({
  name: "meshes-mcp-server",
  version: "1.0.0",
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WORKSPACES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server.registerTool(
  "meshes_list_workspaces",
  {
    title: "List Workspaces",
    description:
      "List all workspaces in the Meshes organization. Workspaces are tenant-scoped containers holding connections, rules, and event logs. In multi-tenant apps, each customer typically has one workspace.",
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    try {
      return toolOk(await client.listWorkspaces());
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_workspace",
  {
    title: "Get Workspace",
    description:
      "Get details of a specific workspace by UUID, including its publishable key for client-side event ingestion.",
    inputSchema: {
      workspace_id: z.string().uuid().describe("The workspace UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ workspace_id }) => {
    try {
      return toolOk(await client.getWorkspace(workspace_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_create_workspace",
  {
    title: "Create Workspace",
    description:
      "Create a new workspace. Typically used when onboarding a new tenant in a multi-tenant SaaS app.",
    inputSchema: {
      name: z
        .string()
        .min(3)
        .max(50)
        .describe(
          "Workspace name (3-50 chars, alphanumeric/space/underscore/dash)"
        ),
      description: z
        .string()
        .max(1024)
        .optional()
        .describe("Optional description (max 1024 chars)"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ name, description }) => {
    try {
      return toolOk(await client.createWorkspace({ name, description }));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_update_workspace",
  {
    title: "Update Workspace",
    description: "Update a workspace's name and description.",
    inputSchema: {
      workspace_id: z.string().uuid().describe("The workspace UUID"),
      name: z.string().min(3).max(50).describe("New name"),
      description: z
        .string()
        .max(1024)
        .nullable()
        .optional()
        .describe("New description (null to clear)"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ workspace_id, name, description }) => {
    try {
      return toolOk(
        await client.updateWorkspace(workspace_id, { name, description })
      );
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_workspace_connections",
  {
    title: "Get Workspace Connections",
    description: "List all connections scoped to a specific workspace.",
    inputSchema: {
      workspace_id: z.string().uuid().describe("The workspace UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ workspace_id }) => {
    try {
      return toolOk(await client.getWorkspaceConnections(workspace_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_workspace_rules",
  {
    title: "Get Workspace Rules",
    description: "List all routing rules scoped to a specific workspace.",
    inputSchema: {
      workspace_id: z.string().uuid().describe("The workspace UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ workspace_id }) => {
    try {
      return toolOk(await client.getWorkspaceRules(workspace_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_workspace_events",
  {
    title: "Get Workspace Events",
    description:
      "List events for a workspace with optional filters. Useful for checking delivery status, debugging, or monitoring event flow.",
    inputSchema: {
      workspace_id: z.string().uuid().describe("The workspace UUID"),
      limit: z
        .number()
        .min(1)
        .max(200)
        .default(50)
        .optional()
        .describe("Results per page (1-200, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response's next_cursor"),
      event: z
        .string()
        .optional()
        .describe("Filter by event type (e.g., 'user.signup')"),
      status: z
        .enum(EVENT_STATUSES)
        .optional()
        .describe("Filter by delivery status"),
      resource: z.string().optional().describe("Filter by resource type"),
      resource_id: z.string().optional().describe("Filter by resource ID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({
    workspace_id,
    limit,
    cursor,
    event,
    status,
    resource,
    resource_id,
  }) => {
    try {
      return toolOk(
        await client.getWorkspaceEvents(workspace_id, {
          limit,
          cursor,
          event,
          status: status as EventStatus | undefined,
          resource,
          resource_id,
        })
      );
    } catch (e) {
      return toolError(e);
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONNECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server.registerTool(
  "meshes_list_connections",
  {
    title: "List Connections",
    description:
      "List all connections across the organization. Connections are configured destinations (HubSpot, Salesforce, Resend, webhooks, etc.) holding credentials and config.",
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    try {
      return toolOk(await client.listConnections());
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_connection",
  {
    title: "Get Connection",
    description:
      "Get details of a specific connection. Does not expose raw credentials.",
    inputSchema: {
      connection_id: z.string().uuid().describe("The connection UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ connection_id }) => {
    try {
      return toolOk(await client.getConnection(connection_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_create_connection",
  {
    title: "Create Connection",
    description:
      "Create a new connection (destination) in a workspace. The metadata object contains connector-specific configuration (API keys, OAuth tokens, webhook URLs, etc.).",
    inputSchema: {
      workspace: z
        .string()
        .uuid()
        .describe("The workspace UUID this connection belongs to"),
      type: z.enum(INTEGRATION_TYPES).describe("Integration type"),
      name: z
        .string()
        .min(1)
        .max(128)
        .describe("Connection name (alphanumeric/space/underscore/dash)"),
      metadata: z
        .record(z.string(), z.unknown())
        .describe("Connector-specific configuration"),
      hidden: z
        .boolean()
        .default(false)
        .optional()
        .describe("Hide from UI (default false)"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ workspace, type, name, metadata, hidden }) => {
    try {
      return toolOk(
        await client.createConnection({
          workspace,
          type: type as IntegrationType,
          name,
          metadata,
          hidden,
        })
      );
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_update_connection",
  {
    title: "Update Connection",
    description: "Update a connection's name, metadata, or visibility.",
    inputSchema: {
      connection_id: z.string().uuid().describe("The connection UUID"),
      name: z.string().min(1).max(128).describe("Updated name"),
      metadata: z
        .record(z.string(), z.unknown())
        .describe("Updated connector-specific configuration"),
      hidden: z.boolean().optional().describe("Hide from UI"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ connection_id, name, metadata, hidden }) => {
    try {
      return toolOk(
        await client.updateConnection(connection_id, { name, metadata, hidden })
      );
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_delete_connection",
  {
    title: "Delete Connection",
    description:
      "Delete a connection. Returns 409 if it has active rules unless force_delete is true.",
    inputSchema: {
      connection_id: z.string().uuid().describe("The connection UUID"),
      force_delete: z
        .boolean()
        .default(false)
        .optional()
        .describe("Force delete even if rules exist"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ connection_id, force_delete }) => {
    try {
      return toolOk(await client.deleteConnection(connection_id, force_delete));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_connection_actions",
  {
    title: "Get Connection Actions",
    description:
      "Get available actions for a connection (e.g., create_or_update_contact, add_to_list). Use this to discover what actions to put in rule metadata.",
    inputSchema: {
      connection_id: z.string().uuid().describe("The connection UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ connection_id }) => {
    try {
      return toolOk(await client.getConnectionActions(connection_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_connection_fields",
  {
    title: "Get Connection Fields",
    description:
      "Get the destination field catalog for a connection. Returns field keys, types, constraints, and allowed values. Useful for building field mappings.",
    inputSchema: {
      connection_id: z.string().uuid().describe("The connection UUID"),
      refresh: z
        .boolean()
        .default(false)
        .optional()
        .describe("Force refresh the field catalog from the provider"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ connection_id, refresh }) => {
    try {
      return toolOk(await client.getConnectionFields(connection_id, refresh));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_connection_default_mappings",
  {
    title: "Get Connection Default Mappings",
    description:
      "Get the default field mapping for a connection. Mappings define how event payload fields map to destination fields with optional transforms (trim, lower, upper, to_string, etc.).",
    inputSchema: {
      connection_id: z.string().uuid().describe("The connection UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ connection_id }) => {
    try {
      return toolOk(await client.getConnectionDefaultMappings(connection_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RULES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server.registerTool(
  "meshes_list_rules",
  {
    title: "List Rules",
    description:
      "List all routing rules across the organization. Rules bind event types to connections with action metadata. Supports filtering by event, resource, and resource_id.",
    inputSchema: {
      event: z
        .string()
        .optional()
        .describe("Filter by event type (e.g., 'user.signup')"),
      resource: z.string().optional().describe("Filter by resource type"),
      resource_id: z.string().optional().describe("Filter by resource ID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ event, resource, resource_id }) => {
    try {
      return toolOk(await client.listRules({ event, resource, resource_id }));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_rule",
  {
    title: "Get Rule",
    description: "Get details of a specific routing rule by UUID.",
    inputSchema: {
      rule_id: z.string().uuid().describe("The rule UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ rule_id }) => {
    try {
      return toolOk(await client.getRule(rule_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_create_rule",
  {
    title: "Create Rule",
    description:
      "Create a routing rule that binds an event type to a connection. The metadata.action field is required and determines what the destination does (e.g., 'create_or_update_contact'). Use meshes_get_connection_actions to discover available actions.",
    inputSchema: {
      workspace: z.string().uuid().describe("The workspace UUID"),
      connection: z
        .string()
        .uuid()
        .describe("The connection UUID this rule routes to"),
      event: z
        .string()
        .min(1)
        .describe(
          "Event type to match (e.g., 'user.signup', 'payment.failed')"
        ),
      action: z
        .string()
        .min(1)
        .describe(
          "The action the destination performs (goes into metadata.action)"
        ),
      resource: z.string().optional().describe("Optional resource type filter"),
      resource_id: z
        .string()
        .optional()
        .describe(
          "Optional resource ID filter (pattern: ^[A-Za-z0-9._:-]{1,64}$)"
        ),
      active: z
        .boolean()
        .default(true)
        .optional()
        .describe("Whether the rule is active (default true)"),
      hidden: z
        .boolean()
        .default(false)
        .optional()
        .describe("Hide from UI (default false)"),
      metadata_extra: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          "Additional metadata fields (id, name, value, key, data, option, option_value)"
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({
    workspace,
    connection,
    event,
    action,
    resource,
    resource_id,
    active,
    hidden,
    metadata_extra,
  }) => {
    try {
      const metadata: RuleMetadata = { action, ...metadata_extra };
      return toolOk(
        await client.createRule({
          workspace,
          connection,
          event,
          metadata,
          resource,
          resource_id,
          active,
          hidden,
        })
      );
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_delete_rule",
  {
    title: "Delete Rule",
    description:
      "Delete a routing rule. Events matching this rule will no longer be routed to its connection.",
    inputSchema: {
      rule_id: z.string().uuid().describe("The rule UUID"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ rule_id }) => {
    try {
      return toolOk(await client.deleteRule(rule_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EVENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server.registerTool(
  "meshes_emit_event",
  {
    title: "Emit Event",
    description:
      "Emit a product event to Meshes for routing and delivery. The event is matched against rules in the specified workspace and delivered to all matching connections. Always include 'email' in the payload for person-related events.",
    inputSchema: {
      workspace: z
        .string()
        .uuid()
        .describe("The workspace UUID to emit the event into"),
      event: z
        .string()
        .min(1)
        .describe(
          "Event type (e.g., 'user.signup', 'payment.failed', 'form.submitted')"
        ),
      payload: z
        .record(z.string(), z.unknown())
        .describe(
          "Event payload. Include 'email' for person-related events. Supports: email, id, ip_address, name, first_name, last_name, phone, resource_url, plus custom fields."
        ),
      resource: z
        .string()
        .optional()
        .describe("Optional resource type (e.g., 'user', 'order')"),
      resource_id: z
        .string()
        .optional()
        .describe("Optional resource ID for deduplication"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ workspace, event, payload, resource, resource_id }) => {
    try {
      const result = await client.emitEvent({
        workspace,
        event,
        payload,
        resource,
        resource_id,
      });
      return {
        content: [
          {
            type: "text" as const,
            text:
              `Event emitted successfully. ID: ${result.event.id}\n` +
              `Event "${event}" will be routed to all matching rules in workspace ${workspace}.\n\n` +
              JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_emit_bulk_events",
  {
    title: "Emit Bulk Events",
    description:
      "Emit up to 100 events in a single request. Returns 201 on full success, 207 on partial success with per-event error details.",
    inputSchema: {
      events: z
        .array(
          z.object({
            workspace: z.string().uuid(),
            event: z.string().min(1),
            payload: z.record(z.string(), z.unknown()),
            resource: z.string().optional(),
            resource_id: z.string().optional(),
          })
        )
        .min(1)
        .max(100)
        .describe("Array of 1-100 event objects"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ events }) => {
    try {
      return toolOk(await client.emitBulkEvents(events));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_list_events",
  {
    title: "List Events",
    description: "List events across the organization with pagination.",
    inputSchema: {
      limit: z
        .number()
        .min(1)
        .max(200)
        .default(50)
        .optional()
        .describe("Results per page (1-200, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ limit, cursor }) => {
    try {
      return toolOk(await client.listEvents({ limit, cursor }));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_event",
  {
    title: "Get Event",
    description:
      "Get event details including delivery status and per-rule results (rule_events). Each rule_event shows connection, integration_type, status, attempt_count, and last_error.",
    inputSchema: {
      event_id: z.string().uuid().describe("The event UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ event_id }) => {
    try {
      return toolOk(await client.getEvent(event_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_get_event_payload",
  {
    title: "Get Event with Payload",
    description:
      "Get event details including the full event payload. Useful for debugging what data was sent.",
    inputSchema: {
      event_id: z.string().uuid().describe("The event UUID"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ event_id }) => {
    try {
      return toolOk(await client.getEventPayload(event_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

server.registerTool(
  "meshes_retry_event_rule",
  {
    title: "Retry Event Rule",
    description:
      "Manually retry a failed rule delivery for a specific event. Use after investigating and fixing the underlying issue (e.g., expired credentials, misconfigured mapping).",
    inputSchema: {
      event_id: z.string().uuid().describe("The event UUID"),
      rule_id: z
        .string()
        .uuid()
        .describe("The rule UUID (from rule_events in the event detail)"),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ event_id, rule_id }) => {
    try {
      return toolOk(await client.retryEventRule(event_id, rule_id));
    } catch (e) {
      return toolError(e);
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INTEGRATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server.registerTool(
  "meshes_list_integrations",
  {
    title: "List Integrations",
    description:
      "Get metadata about all supported integration types. Returns each type's authentication method (oauth, api_key, basic, none), available actions, and field definitions. Useful for discovering what integrations are possible and what actions they support.",
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    try {
      return toolOk(await client.listIntegrations());
    } catch (e) {
      return toolError(e);
    }
  }
);

// ── Start Server ──────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Meshes MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
