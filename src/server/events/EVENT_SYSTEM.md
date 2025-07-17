# Event-Driven Tool Change Notification System

This MCP server template includes a sophisticated event-driven system for managing dynamic tool changes and notifying clients when tools are added, updated, or removed.

## Overview

The event system consists of:

1. **Event Types** - Concrete TypeScript types for tool change events
2. **Event Emitter** - Type-safe event emitter for internal communication
3. **Tool Registry** - Dynamic tool registry that emits change events
4. **MCP Notifications** - Automatic MCP client notifications when tools change

## Architecture

```
Tool Registration/Changes
         ↓
   Tool Registry
         ↓
   Event Emitter
         ↓
    MCP Server
         ↓
  Client Notifications
```

## Core Components

### 1. Event Types (`src/server/events/types.ts`)

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
```

### 2. Event Emitter (`src/server/events/emitter.ts`)

Type-safe event emitter extending Node.js EventEmitter:

```typescript
export class McpEventEmitter extends EventEmitter {
  emit<T extends EventType>(event: T, data: EventData<T>): boolean;
  on<T extends EventType>(event: T, listener: (data: EventData<T>) => void): this;
}
```

### 3. Tool Registry (`src/server/tools/registry.ts`)

Dynamic tool registry that automatically emits events:

```typescript
export class ToolRegistry {
  register(tool: RegistryTool): void;    // Emits tool_added/tool_updated
  unregister(toolName: string): boolean; // Emits tool_removed
  get(toolName: string): RegistryTool | undefined;
  getAll(): RegistryTool[];
}
```

## Usage Examples

### Adding a Tool Dynamically

```typescript
import { toolRegistry } from './server/tools/registry.js';

// Define your tool
const myTool = {
  name: 'my-custom-tool',
  description: 'Does something useful',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  },
  handler: async (args: { input: string }) => {
    return { result: `Processed: ${args.input}` };
  }
};

// Register the tool (automatically emits tool_added event)
toolRegistry.register(myTool);
```

### Listening for Tool Changes

```typescript
import { mcpEventEmitter } from './server/events/emitter.js';

mcpEventEmitter.on('toolChange', (event) => {
  console.log(`Tool ${event.type}: ${event.toolName}`);
  console.log('Metadata:', event.metadata);
});
```

### Using Utility Functions

```typescript
import { emitToolAdded, emitToolUpdated, emitToolRemoved } from './server/events/index.js';

// Manually emit events (if not using the registry)
emitToolAdded('my-tool', {
  description: 'My custom tool',
  reason: 'User requested'
});
```

## MCP Client Notifications

When a tool change event occurs, the server automatically sends an MCP notification to all connected clients:

```json
{
  "method": "notifications/tools/list_changed",
  "params": {
    "event": {
      "type": "tool_added",
      "toolName": "calculator",
      "timestamp": 1703123456789,
      "metadata": {
        "description": "Perform basic mathematical calculations",
        "reason": "Tool dynamically registered"
      }
    }
  }
}
```

## Demo Mode

Test the event system with the built-in demonstration:

```bash
# Start server with event demonstration
npm run build
node dist/index.js --transport http --demo-events

# Watch the logs to see:
# - Tools being added dynamically
# - Tool updates
# - Tool removals
# - MCP notifications being sent
```

## Integration with Existing Tools

The system automatically registers all existing tools from `src/server/tools/index.ts` on server startup. Any new tools added to that module will be available immediately.

## Testing

Run the event system tests:

```bash
npm run test src/server/events/events.test.ts
```

## Best Practices

1. **Use the Registry** - Always use `toolRegistry.register()` instead of manual event emission
2. **Meaningful Metadata** - Include helpful metadata in your tool definitions
3. **Error Handling** - Tool handlers should handle errors gracefully
4. **Type Safety** - Leverage TypeScript types for event data

## Real-World Use Cases

- **Plugin Systems** - Load/unload tools based on configuration
- **Conditional Tools** - Enable tools based on authentication or permissions
- **Dynamic APIs** - Tools that reflect external API changes
- **Development Mode** - Hot-reload tools during development
- **Feature Flags** - Enable/disable tools based on feature flags

## Event Flow Example

```
1. User calls DynamicToolManager.addCalculator()
2. toolRegistry.register(calculatorTool) is called
3. Registry emits 'toolChange' event with type='tool_added'
4. McpServer receives event via event listener
5. Server calls this.notifyToolsChanged(event)
6. MCP notification sent to all connected clients
7. Clients can refresh their tool lists
```

This system enables real-time tool management and keeps MCP clients synchronized with the server's current tool set.