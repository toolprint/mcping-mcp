# DingDong - macOS Notification MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.0.0-purple.svg)](https://github.com/modelcontextprotocol/typescript-sdk)
[![macOS](https://img.shields.io/badge/macOS-Compatible-blue.svg)](https://www.apple.com/macos/)

A Model Context Protocol (MCP) server that enables AI assistants to send desktop notifications on macOS. Built with TypeScript and featuring comprehensive notification options including subtitle, urgency levels, and customizable settings.

## ✨ Features

- 🔔 **macOS Notifications**: Send desktop notifications through macOS Notification Center
- 🎯 **Rich Notification Options**: Title, message, subtitle, urgency levels, and sound control
- ⚡ **Urgency Levels**: Low, normal, and critical priority notifications
- 🎨 **Customizable**: Configurable timeout, sound, and subtitle support
- 🤖 **MCP Protocol Compliance**: Full Model Context Protocol implementation using official SDK
- 🚀 **Dual Transport Support**: Runtime-selectable stdio and HTTP transports
- 🎯 **TypeScript**: ES2022 target with ESNext modules and full type safety
- 🧪 **Testing**: Comprehensive unit and integration test suite
- 🔧 **Developer Experience**: Hot-reload, linting, formatting, and build tools
- 📦 **CLI Interface**: Commander.js-based CLI with proper validation
- 🎨 **Structured Logging**: Pino-based logging with pretty console output
- 🏗️ **Clean Architecture**: Well-organized codebase following SOLID principles

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.0.0 or higher
- macOS (required for desktop notifications)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd dingdong-notification-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Usage

#### Stdio Transport (Default)

```bash
# Run with stdio transport (for use with Claude Code)
npm start

# Or directly with built binary
node dist/index.js --transport stdio
```

#### HTTP Transport

```bash
# Run with HTTP transport on default port 3000
npm start -- --transport http

# Run on custom port
npm start -- --transport http --port 8080

# Run on custom host and port
npm start -- --transport http --host 0.0.0.0 --port 8080
```

#### CLI Options

```bash
# Show help
npm start -- --help

# Enable verbose logging
npm start -- --verbose --transport http
```

#### Test Notification

Once the server is running, you can test notifications:

```bash
# Basic notification
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "send-notification",
    "arguments": {
      "title": "Test Notification",
      "message": "Hello from DingDong!"
    }
  }
}'

# Advanced notification with subtitle and urgency
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "send-notification",
    "arguments": {
      "title": "Critical Alert",
      "message": "This is an important message",
      "subtitle": "DingDong Server",
      "urgency": "critical",
      "sound": true,
      "timeout": 15
    }
  }
}'
```

## 🏗️ Architecture

### Project Structure

```
src/
├── index.ts                    # CLI entry point with Commander.js
├── server/
│   ├── server.ts              # Core MCP server implementation
│   ├── events/                # Event system for tool change notifications
│   │   ├── emitter.ts         # Type-safe event emitter
│   │   ├── types.ts           # Event type definitions
│   │   └── index.ts           # Event utilities
│   ├── transports/
│   │   ├── stdio.ts           # Stdio transport implementation
│   │   └── http.ts            # Express HTTP transport with Streamable HTTP
│   ├── tools/
│   │   ├── index.ts           # Tool registry and exports
│   │   ├── registry.ts        # Dynamic tool registry with events
│   │   └── notification.ts    # macOS notification tool
│   ├── resources/
│   │   ├── index.ts           # Resource provider
│   │   └── prompts.ts         # Prompt resource management
│   └── types/
│       └── schemas.ts         # Zod schemas and type definitions
├── resources/
│   └── prompts/
│       └── welcome.txt        # Static prompt content
└── utils/
    ├── logger.ts              # Logging utility (re-export)
    ├── logging.ts             # Pino-based logging implementation
    ├── banner.ts              # Console banner utilities
    └── config.ts              # Configuration management
```

### Available Tools

| Tool | Description | Input | Output |
|------|-------------|--------|--------|
| `send-notification` | Send a desktop notification on macOS | `{ title: string, message: string, subtitle?: string, urgency?: "low" \| "normal" \| "critical", sound?: boolean, timeout?: number }` | `{ success: boolean, notificationId?: string, error?: string, timestamp: number }` |

#### Notification Tool Details

**Input Parameters:**
- `title` (required): The notification title (1-100 characters)
- `message` (required): The notification message body (1-500 characters)
- `subtitle` (optional): Subtitle text displayed below the title (max 100 characters)
- `urgency` (optional): Notification urgency level - "low", "normal", or "critical" (default: "normal")
- `sound` (optional): Whether to play a sound with the notification (default: true)
- `timeout` (optional): Notification timeout in seconds, 1-60 (default: 10)

**Output:**
- `success`: Boolean indicating if the notification was sent successfully
- `notificationId`: Unique identifier for the notification (on success)
- `error`: Error message if the notification failed (on failure)
- `timestamp`: Unix timestamp when the notification was sent

### Available Resources

| Resource | Description | Type |
|----------|-------------|------|
| `prompt://welcome` | Welcome message and usage instructions | Static text prompt |

## 🧪 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the project |
| `npm run dev` | Development with hot-reload |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run clean` | Clean build artifacts |

### Testing the Server

#### With Claude Code

1. Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "dingdong-notification-server": {
      "command": "node",
      "args": ["path/to/dingdong-notification-server/dist/index.js", "--transport", "stdio"]
    }
  }
}
```

2. Restart Claude Code and test the notification tool:

```
Please send a notification with the title "Test from Claude" and message "This is a test notification from Claude Code"
```

#### Example Claude Code Usage

Once configured, you can ask Claude Code to send notifications:

- **Basic notification**: "Send a notification that says 'Task completed'"
- **With subtitle**: "Send a notification with title 'Build Status', message 'Build completed successfully', and subtitle 'CI/CD Pipeline'"
- **Critical alert**: "Send a critical notification about a system alert"
- **Quiet notification**: "Send a low priority notification without sound"

#### With HTTP Transport

1. Start the server:
```bash
npm start -- --transport http --port 3000
```

2. Test endpoints:
```bash
# Health check
curl http://localhost:3000/health

# Server info
curl http://localhost:3000/

# MCP communication endpoint
curl http://localhost:3000/mcp
```

#### With MCP Inspector

1. Start the server with HTTP transport:
```bash
npm start -- --transport http --port 8990
```

2. Open the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) and connect to `http://localhost:8990/mcp`

### Extending the Server

#### Adding New Tools

1. Create a new tool file in `src/server/tools/`
2. Define the tool schema and handler function
3. Export from `src/server/tools/index.ts`
4. Add tests in corresponding `.test.ts` file

Example:
```typescript
// src/server/tools/my-tool.ts
import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const myToolSchema = z.object({
  input: z.string(),
});

export const myTool: Tool = {
  name: 'my-tool',
  description: 'Description of my tool',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input parameter'
      }
    },
    required: ['input']
  },
};

export async function myToolHandler(args: z.infer<typeof myToolSchema>) {
  return { result: `Processed: ${args.input}` };
}
```

#### Notification Customization

The notification tool can be extended to support additional features:

- **App Icon**: Add custom app icons for different notification types
- **Action Buttons**: Add interactive buttons to notifications
- **Persistence**: Store notification history or preferences
- **Scheduling**: Add support for delayed notifications
- **Categories**: Group notifications by category or source

#### Adding New Resources

1. Add resource files to `src/resources/`
2. Update `src/server/resources/prompts.ts` or create new resource providers
3. Register in `src/server/resources/index.ts`

#### Customizing Transports

- **Stdio**: Modify `src/server/transports/stdio.ts`
- **HTTP**: Extend `src/server/transports/http.ts` with additional middleware or endpoints

## ⚙️ Configuration

The server uses a configuration management system that supports:

- **Transport Selection**: `stdio` or `http`
- **Port Configuration**: For HTTP transport (default: 3000)
- **Host Configuration**: For HTTP transport (default: localhost)
- **Logging Levels**: Controlled via `NODE_ENV` or `--verbose` flag

## 🐛 Troubleshooting

### Common Issues

**Module not found errors**
- Ensure all dependencies are installed: `npm install`
- Check that the build completed successfully: `npm run build`

**Transport connection issues**
- Verify port availability for HTTP transport
- Check firewall settings for HTTP transport
- Ensure stdio streams are properly configured for stdio transport

**Notification permission errors**
- Check that macOS notifications are enabled for Terminal or your terminal app
- Go to System Preferences > Notifications & Focus > Terminal and ensure notifications are allowed
- Test with a simple notification to verify permissions

**Notification not appearing**
- Check Do Not Disturb settings in macOS
- Verify notification center settings
- Test with different urgency levels (critical notifications may override some settings)
- Check the console for error messages with `--verbose` flag

**Tool execution errors**
- Check tool input validation in server logs
- Verify schema compliance in tool implementations
- Review error handling in tool handlers

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
npm start -- --verbose --transport http
```

This will show detailed debug information including request/response logs and internal server state.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Run the test suite: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://github.com/modelcontextprotocol) for the specification and SDK
- [Anthropic](https://www.anthropic.com/) for Claude and MCP development
- The TypeScript and Node.js communities for excellent tooling

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Code](https://claude.ai/code) for testing MCP servers
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) for debugging

## 🚀 Built by Toolprint

**This project is crafted with ❤️ by the devs at [toolprint.ai](https://toolprint.ai)**

### 🌟 Why We Built This

At Toolprint, we are building better tools for the agent ecosystem.

### 🔗 Explore More

- 🏠 **Homepage**: [toolprint.ai](https://toolprint.ai) - Discover our full suite of developer tools
- 🐙 **GitHub**: [github.com/toolprint](https://github.com/toolprint) - Explore our open source projects
- 💬 **Community**: Join our growing community of developers building the future

---

<div align="center">

**🚀 Happy coding! 🚀**

*Built with passion, TypeScript, and way too much coffee by the team at [Toolprint](https://toolprint.ai)*

</div>