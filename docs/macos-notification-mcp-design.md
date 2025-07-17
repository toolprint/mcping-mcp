# macOS Notification MCP Server Design

## Overview

A lightweight MCP server that provides a single tool for sending desktop notifications on macOS. This server will allow MCP clients (like Claude) to trigger native macOS notifications through a simple, well-defined interface.

## Architecture Design

### System Components

```
┌─────────────────────────────────────────────┐
│              MCP Client                      │
│          (Claude, etc.)                      │
└─────────────────┬───────────────────────────┘
                  │ MCP Protocol
┌─────────────────▼───────────────────────────┐
│         MCP Server Core                      │
│  ┌─────────────────────────────────────┐    │
│  │     Transport Layer (stdio/HTTP)     │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │        Tool: send-notification       │    │
│  └─────────────────────────────────────┘    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         macOS Integration Layer              │
│  ┌─────────────────────────────────────┐    │
│  │    node-notifier / osascript         │    │
│  └─────────────────────────────────────┘    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       macOS Notification Center              │
└─────────────────────────────────────────────┘
```

## Tool Design

### Tool Specification

**Tool Name:** `send-notification`

**Description:** "Send a desktop notification on macOS with customizable title, message, and options"

**Input Schema:**
```typescript
interface NotificationInput {
  // Required fields
  title: string;        // Notification title
  message: string;      // Notification body text
  
  // Optional fields
  subtitle?: string;    // Subtitle (appears below title)
  sound?: boolean;      // Play notification sound (default: true)
  icon?: string;        // Path to icon image
  timeout?: number;     // Auto-dismiss timeout in seconds (default: 10)
  urgency?: 'low' | 'normal' | 'critical';  // Notification urgency
  
  // Action buttons (macOS 10.9+)
  actions?: string[];   // Button labels for actions
  closeLabel?: string;  // Label for close button
  
  // Advanced options
  bundleId?: string;    // App bundle ID to send notification as
  groupId?: string;     // Group notifications together
}
```

**Output Schema:**
```typescript
interface NotificationOutput {
  success: boolean;
  notificationId?: string;  // Unique ID for the notification
  error?: string;          // Error message if failed
  timestamp: number;       // When notification was sent
}
```

### Zod Schema Definition

```typescript
import { z } from 'zod';

export const notificationInputSchema = z.object({
  title: z.string().min(1).max(100).describe('Notification title'),
  message: z.string().min(1).max(500).describe('Notification message body'),
  subtitle: z.string().max(100).optional().describe('Subtitle text'),
  sound: z.boolean().default(true).describe('Play notification sound'),
  icon: z.string().optional().describe('Path to icon image'),
  timeout: z.number().min(1).max(60).default(10).describe('Auto-dismiss timeout in seconds'),
  urgency: z.enum(['low', 'normal', 'critical']).default('normal').describe('Notification urgency level'),
  actions: z.array(z.string()).max(3).optional().describe('Action button labels'),
  closeLabel: z.string().optional().describe('Close button label'),
  bundleId: z.string().optional().describe('App bundle ID'),
  groupId: z.string().optional().describe('Notification group ID')
});

export const notificationOutputSchema = z.object({
  success: z.boolean(),
  notificationId: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.number()
});
```

## macOS Integration Options

### Option 1: node-notifier (Recommended)

**Pros:**
- Cross-platform support (if you want to extend later)
- Simple API
- Handles macOS notification center integration
- Supports all notification features

**Implementation:**
```typescript
import notifier from 'node-notifier';

async function sendNotification(input: NotificationInput): Promise<NotificationOutput> {
  return new Promise((resolve) => {
    const notificationId = `notif-${Date.now()}`;
    
    notifier.notify({
      title: input.title,
      message: input.message,
      subtitle: input.subtitle,
      sound: input.sound,
      icon: input.icon,
      timeout: input.timeout,
      actions: input.actions,
      closeLabel: input.closeLabel,
      appID: input.bundleId,
      groupID: input.groupId,
      id: notificationId
    }, (error, response) => {
      if (error) {
        resolve({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      } else {
        resolve({
          success: true,
          notificationId,
          timestamp: Date.now()
        });
      }
    });
  });
}
```

### Option 2: Direct osascript

**Pros:**
- No dependencies
- Direct macOS integration
- Lightweight

**Cons:**
- Limited feature support
- macOS only

**Implementation:**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function sendNotification(input: NotificationInput): Promise<NotificationOutput> {
  const script = `display notification "${input.message}" with title "${input.title}"${
    input.subtitle ? ` subtitle "${input.subtitle}"` : ''
  }${input.sound ? ' sound name "default"' : ''}`;
  
  try {
    await execAsync(`osascript -e '${script}'`);
    return {
      success: true,
      notificationId: `notif-${Date.now()}`,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now()
    };
  }
}
```

### Option 3: Native Node.js addon

**Pros:**
- Full access to macOS notification APIs
- Best performance
- All features available

**Cons:**
- Requires native compilation
- More complex to maintain

## Implementation Plan

### 1. Simplified Project Structure

```
dingdong-notification-mcp/
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── server.ts                # MCP server setup
│   ├── tools/
│   │   └── notification.ts      # Notification tool implementation
│   └── utils/
│       └── logger.ts            # Simple logging
├── package.json
├── tsconfig.json
└── README.md
```

### 2. Core Implementation

**server.ts:**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { notificationTool, notificationHandler } from './tools/notification.js';

export class NotificationMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'macos-notification-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [notificationTool],
    }));

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'send-notification') {
        const result = await notificationHandler(request.params.arguments);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  getServer(): Server {
    return this.server;
  }
}
```

**tools/notification.ts:**
```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import notifier from 'node-notifier';
import { notificationInputSchema, notificationOutputSchema } from '../schemas.js';

export const notificationTool: Tool = {
  name: 'send-notification',
  description: 'Send a desktop notification on macOS',
  inputSchema: notificationInputSchema,
};

export async function notificationHandler(args: any): Promise<any> {
  const input = notificationInputSchema.parse(args);
  
  return new Promise((resolve) => {
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    notifier.notify({
      title: input.title,
      message: input.message,
      subtitle: input.subtitle,
      sound: input.sound !== false,
      icon: input.icon,
      timeout: input.timeout || 10,
      actions: input.actions,
      closeLabel: input.closeLabel,
      id: notificationId,
    }, (error) => {
      if (error) {
        resolve({
          success: false,
          error: error.message,
          timestamp: Date.now(),
        });
      } else {
        resolve({
          success: true,
          notificationId,
          timestamp: Date.now(),
        });
      }
    });
  });
}
```

### 3. Usage Examples

**Basic notification:**
```json
{
  "title": "Hello from Claude!",
  "message": "This is a test notification"
}
```

**Advanced notification:**
```json
{
  "title": "Task Complete",
  "message": "Your analysis has finished running",
  "subtitle": "Click to view results",
  "sound": true,
  "urgency": "normal",
  "actions": ["View Results", "Dismiss"],
  "timeout": 30
}
```

## Security Considerations

1. **Input Validation**: All inputs are validated through Zod schemas
2. **Script Injection**: Sanitize strings when using osascript option
3. **Rate Limiting**: Consider implementing rate limits to prevent notification spam
4. **Permissions**: Ensure the app has notification permissions on macOS

## Testing Strategy

1. **Unit Tests**: Test schema validation and error handling
2. **Integration Tests**: Test actual notification sending (with mocks)
3. **Manual Testing**: Verify notifications appear correctly on macOS

## Future Enhancements

1. **Notification Actions**: Handle button clicks and responses
2. **Rich Notifications**: Support for images and attachments
3. **Notification History**: Track sent notifications
4. **Templates**: Pre-defined notification templates
5. **Scheduling**: Send notifications at specific times
6. **Do Not Disturb**: Respect system DND settings

## Configuration

**MCP client configuration (.mcp.json):**
```json
{
  "mcpServers": {
    "notifications": {
      "command": "node",
      "args": ["/path/to/dingdong-notification-mcp/dist/index.js"],
      "transport": "stdio"
    }
  }
}
```

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "node-notifier": "^10.0.0",
    "zod": "^3.22.4"
  }
}
```