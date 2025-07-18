# MCPing - macOS Notification MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@toolprint/mcping-mcp.svg)](https://www.npmjs.com/package/@toolprint/mcping-mcp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

> I got a ping! 🎉 The spiciest way to make your Mac go ding-dong when your AI has something to say!

MCPing is a Model Context Protocol (MCP) server that enables AI assistants to send desktop notifications on macOS. Finally, your AI can tap you on the shoulder instead of just sitting there quietly being brilliant.

## Installation

**Prerequisites**: Node.js 18+ and macOS (for notifications)

### Quick Start (Recommended)

Add to your MCP client settings:

```json
{
  "mcpServers": {
    "mcping": {
      "command": "npx",
      "args": ["-y", "@toolprint/mcping-mcp"]
    }
  }
}
```

### Manual Installation

```bash
npm install -g @toolprint/mcping-mcp
mcping-mcp
```

## Configuration

### For Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcping": {
      "command": "npx",
      "args": ["-y", "@toolprint/mcping-mcp"]
    }
  }
}
```

### For Development (HTTP Mode)

```bash
# Run in HTTP mode for testing
npx @toolprint/mcping-mcp --transport http --port 3000

# Test with curl
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "send-notification",
      "arguments": {
        "title": "Hello World",
        "message": "This is a test notification"
      }
    }
  }'
```

## Usage

Once configured, ask your AI assistant:

- "Send a notification saying the build is complete"
- "Send a critical alert that the server is down"
- "Send a quiet reminder to take a break"
- "Notify me with title 'Tests Passed' and message 'All 127 tests passed'"

### Tool: send-notification

Send desktop notifications on macOS with rich formatting options.

**Parameters:**
- `title` (required): Notification title (1-100 characters)
- `message` (required): Notification message (1-500 characters)  
- `subtitle` (optional): Additional context (max 100 characters)
- `urgency` (optional): `"low"` | `"normal"` | `"critical"` (default: `"normal"`)
- `sound` (optional): Play notification sound (default: `true`)
- `timeout` (optional): Display duration in seconds, 1-60 (default: 10)

**Examples:**

```javascript
// Basic notification
{
  "title": "Task Complete",
  "message": "Your build finished successfully"
}

// Critical alert with subtitle
{
  "title": "Server Down",
  "message": "Production server is not responding",
  "subtitle": "api.example.com",
  "urgency": "critical",
  "sound": true,
  "timeout": 60
}

// Quiet reminder
{
  "title": "Break Time",
  "message": "You've been coding for 2 hours",
  "urgency": "low",
  "sound": false,
  "timeout": 10
}
```

## Troubleshooting

### Notifications Not Appearing?

1. **Check Permissions**: System Preferences → Notifications → Terminal (allow notifications)
2. **Do Not Disturb**: Ensure DND is disabled or use `urgency: "critical"`
3. **Verbose Mode**: Run with `--verbose` flag for detailed logs

### Common Issues

- **"Permission denied"**: Grant Terminal notification permissions in System Preferences
- **"Not available"**: Ensure you're running on macOS
- **"Rate limited"**: Wait between sending multiple notifications

## Development

```bash
# Clone repository
git clone https://github.com/toolprint/mcping-mcp.git
cd mcping-mcp

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Development mode
npm run dev
```

## License

MIT © [Toolprint](https://toolprint.ai)

## About Toolprint

Building tools for the AI agent ecosystem. Visit [toolprint.ai](https://toolprint.ai) to explore our suite of MCP servers and developer tools.

---

<div align="center">
  <strong>MCPing</strong> - Desktop notifications for AI assistants<br>
  Made with ❤️ by <a href="https://toolprint.ai">Toolprint</a>
</div>