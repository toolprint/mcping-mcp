# MCP TypeScript Server Template

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.0.0-purple.svg)](https://github.com/modelcontextprotocol/typescript-sdk)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

A production-ready Model Context Protocol (MCP) server template built with TypeScript, featuring dual transport support, comprehensive tooling, and best practices for building MCP servers.

## ✨ Features

- 🤖 **MCP Protocol Compliance**: Full Model Context Protocol implementation using official SDK
- 🚀 **Dual Transport Support**: Runtime-selectable stdio and Streamable HTTP transports
- 🛠️ **Built-in Tools**: Example tools (hello-world, echo, health) with proper Zod schemas
- 📚 **Resource System**: File-based resource serving with static prompts
- 🎯 **TypeScript**: ES2022 target with ESNext modules and full type safety
- 🧪 **Testing**: Comprehensive Vitest setup with coverage reporting
- 🔧 **Developer Experience**: Hot-reload, linting, formatting, and build tools
- 📦 **CLI Interface**: Commander.js-based CLI with proper validation
- 🎨 **Structured Logging**: Pino-based logging with pretty console output
- 🔄 **Event System**: Type-safe event emitter for tool change notifications
- 🏗️ **Clean Architecture**: Well-organized codebase following SOLID principles

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.0.0 or higher
- npm or yarn package manager

### Installation

```bash
# Clone or create from template
git clone <your-repo-url>
cd mcp-typescript-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Usage

#### Stdio Transport (Default)

```bash
# Run with stdio transport
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
│   │   ├── hello-world.ts     # Hello world tool
│   │   ├── echo.ts            # Echo tool
│   │   └── health.ts          # Health check tool
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
    ├── output.ts              # Console output utilities with banner system
    └── config.ts              # Configuration management
```

### Available Tools

| Tool | Description | Input | Output |
|------|-------------|--------|--------|
| `hello-world` | Returns a simple greeting message | None | `{ message: string }` |
| `echo` | Echoes back the provided text | `{ text: string }` | `{ echo: string }` |
| `health` | Returns server health status | None | `{ status: "green" \| "yellow" \| "red" }` |

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
    "mcp-typescript-server": {
      "command": "node",
      "args": ["path/to/mcp-typescript-server/dist/index.js", "--transport", "stdio"]
    }
  }
}
```

2. Restart Claude Code and test the tools

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
  inputSchema: myToolSchema,
};

export async function myToolHandler(args: z.infer<typeof myToolSchema>) {
  return { result: `Processed: ${args.input}` };
}
```

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