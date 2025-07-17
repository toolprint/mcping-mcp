# DingDong MCP Architecture Diagrams

## 1. System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[CLI Client]
        HTTP[HTTP Client]
        MCP[MCP Inspector]
    end
    
    subgraph "Transport Layer"
        STDIO[Stdio Transport]
        EXPRESS[HTTP/Express Transport]
    end
    
    subgraph "MCP Server Core"
        SERVER[MCP Server]
        HANDLER[Request Handlers]
        NOTIF[Notification System]
    end
    
    subgraph "Business Logic"
        TOOLS[Tool Registry]
        RESOURCES[Resource Provider]
        EVENTS[Event System]
    end
    
    subgraph "Infrastructure"
        LOG[Pino Logger]
        VAL[Zod Validation]
        CONFIG[Configuration]
    end
    
    CLI --> STDIO
    HTTP --> EXPRESS
    MCP --> EXPRESS
    
    STDIO --> SERVER
    EXPRESS --> SERVER
    
    SERVER --> HANDLER
    SERVER --> NOTIF
    
    HANDLER --> TOOLS
    HANDLER --> RESOURCES
    
    TOOLS --> EVENTS
    EVENTS --> NOTIF
    
    TOOLS --> VAL
    RESOURCES --> LOG
    SERVER --> CONFIG
```

## 2. Component Interaction Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Transport
    participant McpServer
    participant ToolRegistry
    participant ToolHandler
    participant EventEmitter
    
    Client->>Transport: MCP Request
    Transport->>McpServer: Forward Request
    McpServer->>McpServer: Validate Request
    
    alt Tool Execution
        McpServer->>ToolRegistry: Get Tool
        ToolRegistry-->>McpServer: Tool Definition
        McpServer->>ToolHandler: Execute Tool
        ToolHandler-->>McpServer: Tool Result
    else Resource Request
        McpServer->>McpServer: Handle Resource
    end
    
    McpServer-->>Transport: MCP Response
    Transport-->>Client: Forward Response
    
    Note over ToolRegistry,EventEmitter: Tool Change Event
    ToolRegistry->>EventEmitter: Emit Event
    EventEmitter->>McpServer: Tool Change
    McpServer->>Client: Notification
```

## 3. Tool Lifecycle Diagram

```mermaid
stateDiagram-v2
    [*] --> Unregistered
    Unregistered --> Registering: register()
    Registering --> Registered: Success
    Registering --> Unregistered: Failure
    
    Registered --> Executing: call_tool
    Executing --> Registered: Complete
    Executing --> Error: Exception
    Error --> Registered: Recovery
    
    Registered --> Updating: update()
    Updating --> Registered: Success
    
    Registered --> Unregistering: unregister()
    Unregistering --> Unregistered: Success
    Unregistered --> [*]
    
    state Registered {
        [*] --> Available
        Available --> InUse: Client Request
        InUse --> Available: Complete
    }
```

## 4. Event Flow Architecture

```mermaid
graph LR
    subgraph "Tool Operations"
        ADD[Add Tool]
        UPDATE[Update Tool]
        REMOVE[Remove Tool]
    end
    
    subgraph "Tool Registry"
        REG[Registry Map]
        EMIT[Emit Event]
    end
    
    subgraph "Event System"
        EMITTER[McpEventEmitter]
        LISTENER[Event Listeners]
    end
    
    subgraph "MCP Server"
        HANDLER[Event Handler]
        NOTIF[Send Notification]
    end
    
    subgraph "Clients"
        C1[Client 1]
        C2[Client 2]
        CN[Client N]
    end
    
    ADD --> REG
    UPDATE --> REG
    REMOVE --> REG
    
    REG --> EMIT
    EMIT --> EMITTER
    EMITTER --> LISTENER
    LISTENER --> HANDLER
    HANDLER --> NOTIF
    
    NOTIF --> C1
    NOTIF --> C2
    NOTIF --> CN
```

## 5. HTTP Transport Request Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Express
    participant Middleware
    participant StreamableHTTP
    participant McpServer
    
    Browser->>Express: POST /mcp
    Express->>Middleware: CORS Check
    Middleware->>Middleware: Parse JSON
    Middleware->>StreamableHTTP: Handle Request
    
    StreamableHTTP->>StreamableHTTP: Generate Session ID
    StreamableHTTP->>McpServer: Process MCP Request
    
    McpServer-->>StreamableHTTP: MCP Response
    StreamableHTTP-->>Express: HTTP Response
    Express-->>Browser: JSON Response
    
    Note over Browser,Express: GET /mcp for SSE
    Browser->>Express: GET /mcp (SSE)
    Express->>StreamableHTTP: Setup Stream
    StreamableHTTP-->>Browser: Event Stream
    
    loop Server Notifications
        McpServer->>StreamableHTTP: Notification
        StreamableHTTP-->>Browser: SSE Event
    end
```

## 6. Resource Loading Architecture

```mermaid
graph TD
    subgraph "Resource Request"
        REQ[Client Request]
        URI[Resource URI]
    end
    
    subgraph "Resource Provider"
        PROV[Provider Interface]
        META[List Resources]
        LOAD[Load Resource]
    end
    
    subgraph "File System"
        PROMPT[Prompt Files]
        STATIC[Static Resources]
        DYNAMIC[Dynamic Resources]
    end
    
    subgraph "Response"
        CONTENT[Resource Content]
        MIME[MIME Type]
        CACHE[Cache Headers]
    end
    
    REQ --> URI
    URI --> PROV
    
    PROV --> META
    PROV --> LOAD
    
    LOAD --> PROMPT
    LOAD --> STATIC
    LOAD --> DYNAMIC
    
    PROMPT --> CONTENT
    STATIC --> CONTENT
    DYNAMIC --> CONTENT
    
    CONTENT --> MIME
    CONTENT --> CACHE
```

## 7. Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX/ALB]
    end
    
    subgraph "Application Tier"
        APP1[MCP Instance 1]
        APP2[MCP Instance 2]
        APPN[MCP Instance N]
    end
    
    subgraph "Shared Services"
        REDIS[(Redis Cache)]
        PG[(PostgreSQL)]
        S3[S3 Storage]
    end
    
    subgraph "Monitoring"
        PROM[Prometheus]
        GRAF[Grafana]
        ELK[ELK Stack]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APPN
    
    APP1 --> REDIS
    APP2 --> REDIS
    APPN --> REDIS
    
    APP1 --> PG
    APP2 --> PG
    APPN --> PG
    
    APP1 --> S3
    APP2 --> S3
    APPN --> S3
    
    APP1 -.-> PROM
    APP2 -.-> PROM
    APPN -.-> PROM
    
    APP1 -.-> ELK
    APP2 -.-> ELK
    APPN -.-> ELK
    
    PROM --> GRAF
```

## 8. Security Architecture

```mermaid
graph TD
    subgraph "External Requests"
        CLIENT[Client Request]
        TOKEN[Auth Token]
    end
    
    subgraph "Security Layer"
        AUTH[Authentication]
        AUTHZ[Authorization]
        VAL[Input Validation]
        RATE[Rate Limiting]
    end
    
    subgraph "MCP Server"
        HANDLER[Request Handler]
        TOOLS[Tool Execution]
        AUDIT[Audit Logger]
    end
    
    subgraph "Security Policies"
        RBAC[RBAC Rules]
        LIMITS[Rate Limits]
        SANDBOX[Execution Sandbox]
    end
    
    CLIENT --> TOKEN
    TOKEN --> AUTH
    AUTH --> AUTHZ
    AUTHZ --> VAL
    VAL --> RATE
    
    RATE --> HANDLER
    HANDLER --> TOOLS
    HANDLER --> AUDIT
    
    AUTHZ --> RBAC
    RATE --> LIMITS
    TOOLS --> SANDBOX
    
    style AUTH fill:#f9f,stroke:#333,stroke-width:4px
    style AUTHZ fill:#f9f,stroke:#333,stroke-width:4px
    style SANDBOX fill:#f9f,stroke:#333,stroke-width:4px
```

## 9. Tool Execution Pipeline

```mermaid
graph LR
    subgraph "Input Stage"
        REQ[Tool Request]
        SCHEMA[Input Schema]
        VALIDATE[Zod Validation]
    end
    
    subgraph "Execution Stage"
        REGISTRY[Tool Lookup]
        HANDLER[Handler Function]
        SANDBOX[Execution Context]
    end
    
    subgraph "Output Stage"
        RESULT[Raw Result]
        FORMAT[Format Response]
        RESPONSE[MCP Response]
    end
    
    subgraph "Error Handling"
        ERROR[Error Catch]
        LOG[Error Log]
        GRACEFUL[Graceful Response]
    end
    
    REQ --> SCHEMA
    SCHEMA --> VALIDATE
    VALIDATE --> REGISTRY
    REGISTRY --> HANDLER
    HANDLER --> SANDBOX
    
    SANDBOX --> RESULT
    RESULT --> FORMAT
    FORMAT --> RESPONSE
    
    VALIDATE -.-> ERROR
    HANDLER -.-> ERROR
    SANDBOX -.-> ERROR
    
    ERROR --> LOG
    ERROR --> GRACEFUL
```

## 10. Configuration Flow

```mermaid
graph TD
    subgraph "Configuration Sources"
        CLI[CLI Arguments]
        ENV[Environment Variables]
        FILE[Config Files]
        DEFAULT[Default Values]
    end
    
    subgraph "Configuration Manager"
        PARSE[Parse & Validate]
        MERGE[Merge Configs]
        RESOLVE[Resolve Conflicts]
    end
    
    subgraph "Application Components"
        SERVER[Server Config]
        TRANSPORT[Transport Config]
        LOGGING[Logging Config]
        TOOLS[Tools Config]
    end
    
    CLI --> PARSE
    ENV --> PARSE
    FILE --> PARSE
    DEFAULT --> PARSE
    
    PARSE --> MERGE
    MERGE --> RESOLVE
    
    RESOLVE --> SERVER
    RESOLVE --> TRANSPORT
    RESOLVE --> LOGGING
    RESOLVE --> TOOLS
    
    style RESOLVE fill:#bbf,stroke:#333,stroke-width:2px
```

## Usage Guide

These diagrams can be rendered using any Mermaid-compatible viewer:
- GitHub/GitLab markdown files
- VS Code with Mermaid extension
- Online editors like mermaid.live
- Documentation tools like MkDocs or Docusaurus

Each diagram focuses on a specific aspect of the DingDong MCP architecture:
1. **System Overview**: High-level component relationships
2. **Component Interaction**: Request/response flow
3. **Tool Lifecycle**: State management for tools
4. **Event Flow**: Event-driven architecture
5. **HTTP Transport**: HTTP-specific request handling
6. **Resource Loading**: Resource management flow
7. **Deployment**: Production deployment topology
8. **Security**: Security layers and controls
9. **Tool Execution**: Tool processing pipeline
10. **Configuration**: Configuration management flow