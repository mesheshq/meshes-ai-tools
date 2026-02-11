/**
 * Meshes API client — matches the OpenAPI spec at https://docs.meshes.dev
 * Base URL: https://api.meshes.io
 */
export type IntegrationType = "activecampaign" | "aweber" | "hubspot" | "intercom" | "mailchimp" | "mailerlite" | "resend" | "salesforce" | "webhook" | "zoom";
export type EventStatus = "pending" | "processing" | "completed" | "failed";
export interface PaginatedResponse<T> {
    count: number;
    limit: number;
    next_cursor: string | null;
    records: T[];
}
export interface Workspace {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    publishable_key?: {
        public_key: string;
        name: string;
    };
}
export interface Connection {
    id: string;
    workspace: string;
    type: IntegrationType;
    name: string;
    metadata: Record<string, unknown>;
    action_data?: Record<string, unknown>;
    hidden: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface RuleMetadata {
    action: string;
    id?: string;
    name?: string;
    value?: string;
    key?: string;
    data?: string;
    option?: string;
    option_value?: string;
    [key: string]: string | undefined;
}
export interface Rule {
    id: string;
    connection: string;
    workspace: string;
    type: IntegrationType;
    resource?: string;
    resource_id?: string;
    event: string;
    metadata: RuleMetadata;
    active: boolean;
    hidden: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface RuleEvent {
    id: string;
    type: "rule";
    workspace: string;
    event: string;
    event_id: string;
    resource?: string;
    resource_id?: string;
    connection: string;
    rule: string;
    integration_type: IntegrationType;
    status: EventStatus;
    attempt_count: number;
    started_at?: string;
    completed_at?: string;
    last_error?: string;
    created_by: string;
    created_at: string;
}
export interface MeshesEvent {
    id: string;
    type?: "event";
    workspace: string;
    event: string;
    resource?: string;
    resource_id?: string;
    status: EventStatus;
    total_rules?: number;
    completed_count?: number;
    failed_count?: number;
    started_at?: string;
    completed_at?: string;
    created_by: string;
    created_at: string;
    rule_events?: RuleEvent[];
    payload?: Record<string, unknown>;
}
export interface MeshesConfig {
    accessKey: string;
    secretKey: string;
    orgId: string;
    baseUrl: string;
}
export declare class MeshesApiClient {
    private config;
    constructor(config: MeshesConfig);
    private request;
    listWorkspaces(): Promise<PaginatedResponse<Workspace>>;
    getWorkspace(id: string): Promise<Workspace>;
    createWorkspace(params: {
        name: string;
        description?: string;
    }): Promise<{
        workspace: Workspace;
    }>;
    updateWorkspace(id: string, params: {
        name: string;
        description?: string | null;
    }): Promise<Workspace>;
    getWorkspaceConnections(id: string): Promise<PaginatedResponse<Connection>>;
    getWorkspaceRules(id: string): Promise<PaginatedResponse<Rule>>;
    getWorkspaceEvents(id: string, params?: {
        limit?: number;
        cursor?: string;
        event?: string;
        status?: EventStatus;
        resource?: string;
        resource_id?: string;
    }): Promise<PaginatedResponse<MeshesEvent>>;
    listConnections(): Promise<PaginatedResponse<Connection>>;
    getConnection(id: string): Promise<Connection>;
    createConnection(params: {
        workspace: string;
        type: IntegrationType;
        name: string;
        metadata: Record<string, unknown>;
        hidden?: boolean;
    }): Promise<{
        connection: Connection;
    }>;
    updateConnection(id: string, params: {
        name: string;
        metadata: Record<string, unknown>;
        hidden?: boolean;
    }): Promise<Connection>;
    deleteConnection(id: string, forceDelete?: boolean): Promise<{
        id: string;
        type: IntegrationType;
    }>;
    getConnectionActions(id: string): Promise<unknown>;
    getConnectionFields(id: string, refresh?: boolean): Promise<unknown>;
    getConnectionDefaultMappings(id: string): Promise<unknown>;
    listRules(params?: {
        event?: string;
        resource?: string;
        resource_id?: string;
    }): Promise<PaginatedResponse<Rule>>;
    getRule(id: string): Promise<Rule>;
    createRule(params: {
        workspace: string;
        connection: string;
        event: string;
        metadata: RuleMetadata;
        resource?: string;
        resource_id?: string;
        active?: boolean;
        hidden?: boolean;
    }): Promise<{
        rule: Rule;
    }>;
    deleteRule(id: string): Promise<{
        id: string;
        connection: string;
        type: IntegrationType;
        event: string;
    }>;
    listEvents(params?: {
        limit?: number;
        cursor?: string;
    }): Promise<PaginatedResponse<MeshesEvent>>;
    emitEvent(params: {
        workspace: string;
        event: string;
        payload: Record<string, unknown>;
        resource?: string;
        resource_id?: string;
    }): Promise<{
        event: {
            id: string;
            event: string;
            workspace: string;
            created_by: string;
            created_at: string;
        };
    }>;
    emitBulkEvents(events: Array<{
        workspace: string;
        event: string;
        payload: Record<string, unknown>;
        resource?: string;
        resource_id?: string;
    }>): Promise<{
        count: number;
        error_count?: number;
        records: unknown[];
    }>;
    getEvent(id: string): Promise<MeshesEvent>;
    getEventPayload(id: string): Promise<MeshesEvent>;
    retryEventRule(eventId: string, ruleId: string): Promise<RuleEvent>;
    listIntegrations(): Promise<PaginatedResponse<unknown>>;
}
