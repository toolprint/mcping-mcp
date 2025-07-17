# DingDong MCP API Specification

## Overview

This document defines the complete API specification for the DingDong MCP Server, including MCP protocol compliance, HTTP REST endpoints, and internal interfaces.

## Table of Contents

1. [MCP Protocol API](#mcp-protocol-api)
2. [HTTP Transport API](#http-transport-api)
3. [Internal Component APIs](#internal-component-apis)
4. [Error Handling](#error-handling)
5. [Security](#security)

## MCP Protocol API

### Base Protocol

The server implements the Model Context Protocol (MCP) specification v1.0.0.

#### Request/Response Format

All MCP requests follow the JSON-RPC 2.0 format:

```typescript
interface McpRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

interface McpResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: McpError;
}

interface McpError {
  code: number;
  message: string;
  data?: any;
}
```

### Tool Operations

#### list_tools

List all available tools with their schemas.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "hello-world",
        "description": "Returns a simple greeting message",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        }
      },
      {
        "name": "echo",
        "description": "Echoes back the provided text",
        "inputSchema": {
          "type": "object",
          "properties": {
            "text": {
              "type": "string",
              "description": "Text to echo back"
            }
          },
          "required": ["text"],
          "additionalProperties": false
        }
      }
    ]
  }
}
```

#### call_tool

Execute a specific tool with provided arguments.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "text": "Hello, MCP!"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"echo\": \"Hello, MCP!\"\n}"
      }
    ]
  }
}
```

### Resource Operations

#### list_resources

List all available resources.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "resources": [
      {
        "uri": "prompt://welcome",
        "name": "Welcome Prompt",
        "description": "Welcome message and usage instructions",
        "mimeType": "text/plain"
      }
    ]
  }
}
```

#### read_resource

Read the content of a specific resource.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/read",
  "params": {
    "uri": "prompt://welcome"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "contents": [
      {
        "uri": "prompt://welcome",
        "mimeType": "text/plain",
        "text": "Welcome to the MCP TypeScript Server!..."
      }
    ]
  }
}
```

### Notifications

#### tools/list_changed

Sent when the tool list changes (tool added, updated, or removed).

**Notification:**
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed",
  "params": {
    "type": "tool_added",
    "toolName": "calculator",
    "timestamp": 1703123456789
  }
}
```

## HTTP Transport API

### Base URL

```
http://localhost:3000
```

### Endpoints

#### GET /

Server information and status.

**Response:**
```json
{
  "name": "DingDong MCP",
  "version": "0.0.1",
  "transport": "streamable-http",
  "endpoints": {
    "health": "/health",
    "mcp": "/mcp"
  },
  "status": "ready"
}
```

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "server": "dingdong-mcp",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /mcp

Main MCP protocol endpoint for request/response communication.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
Any valid MCP request (see MCP Protocol API section).

**Response:**
Corresponding MCP response.

**Example:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

#### GET /mcp

Server-sent events endpoint for receiving notifications.

**Headers:**
```
Accept: text/event-stream
```

**Response:**
Server-sent event stream with MCP notifications.

**Example:**
```bash
curl -N http://localhost:3000/mcp \
  -H "Accept: text/event-stream"
```

## Internal Component APIs

### Tool Registry API

```typescript
interface ToolRegistry {
  /**
   * Register a new tool
   * @emits toolChange event with type 'tool_added' or 'tool_updated'
   */
  register(tool: RegistryTool): void;

  /**
   * Unregister a tool
   * @emits toolChange event with type 'tool_removed'
   * @returns true if tool was removed, false if not found
   */
  unregister(toolName: string): boolean;

  /**
   * Get a tool by name
   */
  get(toolName: string): RegistryTool | undefined;

  /**
   * Get all registered tools
   */
  getAll(): RegistryTool[];

  /**
   * Get all tool names
   */
  getNames(): string[];

  /**
   * Check if a tool exists
   */
  has(toolName: string): boolean;

  /**
   * Get the number of registered tools
   */
  size(): number;

  /**
   * Clear all tools
   * @emits toolChange event for each removed tool
   */
  clear(): void;
}
```

### Event System API

```typescript
interface McpEventEmitter extends EventEmitter {
  /**
   * Emit a typed event
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): boolean;

  /**
   * Listen for a typed event
   */
  on<K extends keyof EventMap>(
    event: K, 
    listener: (data: EventMap[K]) => void
  ): this;

  /**
   * Remove a typed event listener
   */
  off<K extends keyof EventMap>(
    event: K, 
    listener: (data: EventMap[K]) => void
  ): this;
}

interface EventMap {
  toolChange: ToolChangeEvent;
}

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
```

### Resource Provider API

```typescript
interface ResourceProvider {
  /**
   * List all available resources
   */
  listResources(): ResourceMetadata[];

  /**
   * Get a specific resource by URI
   */
  getResource(uri: string): Promise<Resource | null>;
}

interface ResourceMetadata {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface Resource extends ResourceMetadata {
  content: string;
}
```

## Error Handling

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| -32700 | Parse error | Invalid JSON was received |
| -32600 | Invalid Request | The JSON sent is not a valid Request object |
| -32601 | Method not found | The method does not exist or is not available |
| -32602 | Invalid params | Invalid method parameter(s) |
| -32603 | Internal error | Internal JSON-RPC error |
| -32000 | Tool not found | The requested tool does not exist |
| -32001 | Resource not found | The requested resource does not exist |
| -32002 | Tool execution error | Error occurred during tool execution |
| -32003 | Validation error | Input validation failed |

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Tool not found",
    "data": {
      "toolName": "unknown-tool",
      "availableTools": ["hello-world", "echo", "health"]
    }
  }
}
```

## Security

### Authentication

Future versions will support authentication via:
- API Keys (header: `X-API-Key`)
- JWT Tokens (header: `Authorization: Bearer <token>`)

### Rate Limiting

Rate limiting can be configured per endpoint:
- `/mcp`: 100 requests per minute
- `/health`: 1000 requests per minute

### CORS Configuration

Default CORS settings:
```typescript
{
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  credentials: true
}
```

### Input Validation

All inputs are validated using Zod schemas before processing:
- Tool arguments are validated against tool-specific schemas
- Request parameters are validated against MCP protocol schemas
- URI parameters are sanitized to prevent path traversal

## Versioning

The API follows semantic versioning:
- Current version: 1.0.0
- Version header: `X-MCP-Version: 1.0.0`
- Backward compatibility maintained within major versions

## WebSocket Support (Future)

Future versions will support WebSocket connections for bidirectional communication:
- Endpoint: `ws://localhost:3000/mcp-ws`
- Protocol: `mcp.v1`
- Automatic reconnection with exponential backoff