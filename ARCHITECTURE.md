# DingDong MCP Server Architecture

## Overview

DingDong MCP is a production-ready Model Context Protocol (MCP) server built with TypeScript. It implements a modular, event-driven architecture with dual transport support (stdio/HTTP), comprehensive tooling, and adherence to MCP protocol specifications.

## System Architecture

### Core Design Principles

1. **Modularity**: Clear separation of concerns with well-defined interfaces
2. **Event-Driven**: Reactive architecture for dynamic tool management
3. **Type Safety**: Full TypeScript implementation with strict typing
4. **Protocol Compliance**: Adherence to MCP specification
5. **Extensibility**: Easy addition of new tools, resources, and transports

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Interface                            │
│                    (Commander.js Entry Point)                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                      MCP Server Core                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Transport   │  │     Tool     │  │     Resource       │   │
│  │   Manager     │  │   Registry   │  │     Provider       │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘   │
│         │                  │                    │                │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌────────▼───────────┐   │
│  │    Stdio     │  │   Tool       │  │   File-based       │   │
│  │  Transport   │  │  Handlers    │  │   Resources        │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │     HTTP     │  │    Event     │  │    Validation      │   │
│  │  Transport   │  │   Emitter    │  │    (Zod)           │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. CLI Interface Layer

**Purpose**: Entry point for the application with command-line argument parsing

**Components**:
- **index.ts**: Main entry point using Commander.js
- **Command Parser**: Validates and parses CLI arguments
- **Transport Selector**: Routes to appropriate transport based on flags

**Interfaces**:
```typescript
interface CliOptions {
  transport: 'stdio' | 'http';
  port?: number;
  host?: string;
  verbose?: boolean;
}
```

### 2. MCP Server Core

**Purpose**: Central orchestrator implementing MCP protocol

**Components**:
- **McpServer Class**: Core server implementation
- **Request Handlers**: Protocol-compliant request processing
- **Capability Registration**: Dynamic capability advertisement

**Key Interfaces**:
```typescript
interface McpServerConfig {
  name: string;
  version: string;
  capabilities: {
    resources: ResourceCapabilities;
    tools: ToolCapabilities;
  };
}

class McpServer {
  constructor(config: McpServerConfig);
  setRequestHandler(schema: Schema, handler: Handler): void;
  notification(notification: Notification): void;
  connect(transport: Transport): Promise<void>;
  close(): Promise<void>;
}
```

### 3. Transport Layer

**Purpose**: Abstract communication protocols (stdio/HTTP)

**Components**:

#### Stdio Transport
- Direct process communication via stdin/stdout
- Synchronous message handling
- Ideal for CLI integration

#### HTTP Transport
- Express-based REST endpoints
- StreamableHTTP for bidirectional communication
- CORS support for browser clients
- Health check endpoints

**Interfaces**:
```typescript
interface Transport {
  start(): Promise<void>;
  stop(): Promise<void>;
  handleRequest(request: McpRequest): Promise<McpResponse>;
}

interface HttpTransportConfig {
  port: number;
  host: string;
  corsOptions?: CorsOptions;
}
```

### 4. Tool Management System

**Purpose**: Dynamic tool registration and execution

**Components**:
- **Tool Registry**: Centralized tool storage with CRUD operations
- **Tool Handlers**: Individual tool implementation functions
- **Event Integration**: Automatic event emission on changes

**Interfaces**:
```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: ZodSchema;
}

interface RegistryTool extends Tool {
  handler: ToolHandler;
}

interface ToolHandler {
  (args: any): Promise<any>;
}

class ToolRegistry {
  register(tool: RegistryTool): void;
  unregister(toolName: string): boolean;
  get(toolName: string): RegistryTool | undefined;
  getAll(): RegistryTool[];
}
```

### 5. Event System

**Purpose**: Real-time notification of system changes

**Components**:
- **Type-safe Event Emitter**: Extends Node.js EventEmitter
- **Event Types**: Strongly typed event definitions
- **MCP Notifications**: Client notification integration

**Interfaces**:
```typescript
interface ToolChangeEvent {
  type: 'tool_added' | 'tool_removed' | 'tool_updated';
  toolName: string;
  timestamp: number;
  metadata?: {
    description?: string;
    inputSchema?: any;
    reason?: string;
  };
}

interface EventMap {
  toolChange: ToolChangeEvent;
}

class McpEventEmitter extends EventEmitter {
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): boolean;
  on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this;
}
```

### 6. Resource Management

**Purpose**: Serve static and dynamic resources

**Components**:
- **Resource Provider**: Abstract resource loading
- **File-based Resources**: Static file serving
- **Prompt Management**: Specialized prompt resources

**Interfaces**:
```typescript
interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  content: string;
}

interface ResourceProvider {
  listResources(): ResourceMetadata[];
  getResource(uri: string): Promise<Resource | null>;
}
```

### 7. Validation Layer

**Purpose**: Runtime type validation and schema enforcement

**Components**:
- **Zod Schemas**: Input/output validation
- **Error Handling**: Graceful validation failures
- **Type Guards**: Runtime type safety

**Example Schemas**:
```typescript
const EchoToolSchema = z.object({
  text: z.string().describe('Text to echo back')
});

const HealthResponseSchema = z.object({
  status: z.enum(['green', 'yellow', 'red'])
});
```

## Data Flow

### Tool Execution Flow

```
Client Request → Transport Layer → MCP Server
                                      ↓
                              Validate Request
                                      ↓
                              Tool Registry Lookup
                                      ↓
                              Execute Tool Handler
                                      ↓
                              Format Response
                                      ↓
Client Response ← Transport Layer ← MCP Server
```

### Event Flow

```
Tool Change → Tool Registry → Emit Event
                                  ↓
                          Event Emitter
                                  ↓
                          MCP Server Listener
                                  ↓
                          Client Notification
```

## API Specifications

### MCP Protocol Endpoints

#### Tool Operations
- **list_tools**: Returns available tools with schemas
- **call_tool**: Executes a specific tool with arguments

#### Resource Operations
- **list_resources**: Returns available resources
- **read_resource**: Retrieves specific resource content

### HTTP API Endpoints

```yaml
GET /:
  description: Server information
  response:
    name: string
    version: string
    transport: string
    endpoints: object

GET /health:
  description: Health check endpoint
  response:
    status: "healthy"
    server: string
    timestamp: ISO8601

POST /mcp:
  description: MCP protocol endpoint
  contentType: application/json
  body: MCP Request
  response: MCP Response

GET /mcp:
  description: Server-sent events for notifications
  contentType: text/event-stream
```

## Deployment Architecture

### Development Environment

```yaml
setup:
  - npm install
  - npm run build
  
development:
  - npm run dev (hot-reload)
  - Vitest for testing
  - ESLint/Prettier for code quality

testing:
  - Unit tests: npm run test:unit
  - Integration tests: npm run test:integration
  - Coverage: npm run test:coverage
```

### Production Deployment

#### Containerized Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY resources ./resources
EXPOSE 3000
CMD ["node", "dist/index.js", "--transport", "http"]
```

#### Process Management

```yaml
# PM2 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'dingdong-mcp',
    script: './dist/index.js',
    args: '--transport http --port 3000',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

### Scalability Considerations

#### Horizontal Scaling
- Stateless design enables multiple instances
- Load balancer for HTTP transport distribution
- Shared tool registry via external storage (Redis/PostgreSQL)

#### Performance Optimization
- Connection pooling for database resources
- Caching layer for frequently accessed resources
- Async tool execution with worker threads
- Request rate limiting and throttling

#### Monitoring & Observability
- Structured logging with Pino
- Metrics collection (Prometheus format)
- Health check endpoints
- Distributed tracing support

## Security Architecture

### Transport Security
- TLS/SSL for HTTP transport
- Input validation at all entry points
- CORS configuration for browser clients

### Tool Security
- Sandboxed tool execution
- Resource access control
- Rate limiting per tool
- Audit logging for tool usage

### Authentication & Authorization
- Token-based authentication (JWT)
- Role-based access control (RBAC)
- API key management
- Session management for HTTP transport

## Extension Points

### Adding New Tools
1. Create tool definition with Zod schema
2. Implement tool handler function
3. Register in tool registry
4. Add unit tests

### Adding New Transports
1. Implement Transport interface
2. Add to transport factory
3. Update CLI options
4. Add integration tests

### Adding New Resource Types
1. Extend ResourceProvider
2. Implement resource loading logic
3. Register resource type
4. Update resource discovery

## Best Practices

### Code Organization
- Feature-based directory structure
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive documentation

### Error Handling
- Graceful degradation
- Meaningful error messages
- Proper error propagation
- Client-friendly error responses

### Testing Strategy
- Unit tests for individual components
- Integration tests for workflows
- E2E tests for protocol compliance
- Performance benchmarks

### Logging & Monitoring
- Structured logging format
- Appropriate log levels
- Performance metrics
- Error tracking