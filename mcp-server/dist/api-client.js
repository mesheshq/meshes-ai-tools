/**
 * Meshes API client — matches the OpenAPI spec at https://docs.meshes.dev
 * Base URL: https://api.meshes.io
 */
// ── JWT Token Generation ──────────────────────────────────────
// Meshes uses short-lived HS256 JWTs for machine-to-machine auth.
// See: https://meshes.io/docs/api/authentication
async function mintJwt(config) {
    // Dynamic import — jose is an ESM package
    const { SignJWT } = await import("jose");
    const key = new TextEncoder().encode(config.secretKey);
    const token = await new SignJWT({ org: config.orgId })
        .setProtectedHeader({ alg: "HS256", typ: "JWT", kid: config.accessKey })
        .setIssuer(`urn:meshes:m2m:${config.accessKey}`)
        .setAudience("meshes-api")
        .setIssuedAt()
        .setExpirationTime("30s")
        .sign(key);
    return token;
}
// ── Client ────────────────────────────────────────────────────
export class MeshesApiClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async request(path, options = {}) {
        const token = await mintJwt(this.config);
        const url = `${this.config.baseUrl}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Meshes API ${response.status}: ${body}`);
        }
        if (response.status === 204)
            return {};
        return response.json();
    }
    // ── Workspaces ────────────────────────────────────────────
    listWorkspaces() {
        return this.request("/api/v1/workspaces");
    }
    getWorkspace(id) {
        return this.request(`/api/v1/workspaces/${id}`);
    }
    createWorkspace(params) {
        return this.request("/api/v1/workspaces", {
            method: "POST",
            body: JSON.stringify(params),
        });
    }
    updateWorkspace(id, params) {
        return this.request(`/api/v1/workspaces/${id}`, {
            method: "PUT",
            body: JSON.stringify(params),
        });
    }
    getWorkspaceConnections(id) {
        return this.request(`/api/v1/workspaces/${id}/connections`);
    }
    getWorkspaceRules(id) {
        return this.request(`/api/v1/workspaces/${id}/rules`);
    }
    getWorkspaceEvents(id, params) {
        const query = new URLSearchParams();
        if (params?.limit)
            query.set("limit", String(params.limit));
        if (params?.cursor)
            query.set("cursor", params.cursor);
        if (params?.event)
            query.set("event", params.event);
        if (params?.status)
            query.set("status", params.status);
        if (params?.resource)
            query.set("resource", params.resource);
        if (params?.resource_id)
            query.set("resource_id", params.resource_id);
        const qs = query.toString();
        return this.request(`/api/v1/workspaces/${id}/events${qs ? `?${qs}` : ""}`);
    }
    // ── Connections ───────────────────────────────────────────
    listConnections() {
        return this.request("/api/v1/connections");
    }
    getConnection(id) {
        return this.request(`/api/v1/connections/${id}`);
    }
    createConnection(params) {
        return this.request("/api/v1/connections", {
            method: "POST",
            body: JSON.stringify(params),
        });
    }
    updateConnection(id, params) {
        return this.request(`/api/v1/connections/${id}`, {
            method: "PUT",
            body: JSON.stringify(params),
        });
    }
    deleteConnection(id, forceDelete) {
        return this.request(`/api/v1/connections/${id}`, {
            method: "DELETE",
            body: forceDelete ? JSON.stringify({ force_delete: true }) : undefined,
        });
    }
    getConnectionActions(id) {
        return this.request(`/api/v1/connections/${id}/actions`);
    }
    getConnectionFields(id, refresh) {
        const qs = refresh ? "?refresh=true" : "";
        return this.request(`/api/v1/connections/${id}/fields${qs}`);
    }
    getConnectionDefaultMappings(id) {
        return this.request(`/api/v1/connections/${id}/mappings/default`);
    }
    // ── Rules ─────────────────────────────────────────────────
    listRules(params) {
        const query = new URLSearchParams();
        if (params?.event)
            query.set("event", params.event);
        if (params?.resource)
            query.set("resource", params.resource);
        if (params?.resource_id)
            query.set("resource_id", params.resource_id);
        const qs = query.toString();
        return this.request(`/api/v1/rules${qs ? `?${qs}` : ""}`);
    }
    getRule(id) {
        return this.request(`/api/v1/rules/${id}`);
    }
    createRule(params) {
        return this.request("/api/v1/rules", {
            method: "POST",
            body: JSON.stringify(params),
        });
    }
    deleteRule(id) {
        return this.request(`/api/v1/rules/${id}`, { method: "DELETE" });
    }
    // ── Events ────────────────────────────────────────────────
    listEvents(params) {
        const query = new URLSearchParams();
        if (params?.limit)
            query.set("limit", String(params.limit));
        if (params?.cursor)
            query.set("cursor", params.cursor);
        const qs = query.toString();
        return this.request(`/api/v1/events${qs ? `?${qs}` : ""}`);
    }
    emitEvent(params) {
        return this.request("/api/v1/events", {
            method: "POST",
            body: JSON.stringify(params),
        });
    }
    emitBulkEvents(events) {
        return this.request("/api/v1/events/bulk", {
            method: "POST",
            body: JSON.stringify(events),
        });
    }
    getEvent(id) {
        return this.request(`/api/v1/events/${id}`);
    }
    getEventPayload(id) {
        return this.request(`/api/v1/events/${id}/payload`);
    }
    retryEventRule(eventId, ruleId) {
        return this.request(`/api/v1/events/${eventId}/rules/${ruleId}/retry`, {
            method: "POST",
        });
    }
    // ── Integrations ──────────────────────────────────────────
    listIntegrations() {
        return this.request("/api/v1/integrations");
    }
}
//# sourceMappingURL=api-client.js.map