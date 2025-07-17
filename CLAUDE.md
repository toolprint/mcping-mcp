# MCP TypeScript Server Template - Claude Code Integration Guide

## 📋 Agent Task Management

### 🎯 Task Assignment Process

#### Before Starting Any Task:

**Step 1: Get Your Task Assignment**
- If `TASK_ID` environment variable is set, use that task ID
- If not set, you need to claim an available task using this process:

1. **Find Available Tasks**: Use `mcp__taskmaster-ai__get_tasks --status pending` to see unassigned tasks
2. **Claim a Task**: Look for tasks whose details DON'T contain "Assigned to claude-squad" 
3. **Mark Assignment**: Use `mcp__taskmaster-ai__update_task --id <task-id> --append true --prompt "Assigned to claude-squad session-<unique-id>"`
4. **Set In Progress**: Use `mcp__taskmaster-ai__set_task_status --id <task-id> --status in-progress`

**Step 2: Get Full Context**
1. **Read the PRD**: Check `.taskmaster/docs/prd.txt` for complete context
2. **Get Task Details**: Use `mcp__taskmaster-ai__get_task --id <your-task-id>` to see your specific requirements
3. **Review Dependencies**: Understand which tasks must complete before yours
4. **Study Codebase**: Examine existing implementation patterns and architecture

### 🔄 Task Completion Workflow

#### When You're Done:
1. **Test Your Implementation**: 
   - Run ALL tests (`npm test` or `npm run test:unit`) and verify they pass
   - Ensure tests specifically related to your changes are passing
   - If you added new functionality, write tests for it and verify they pass
   - If you modified existing functionality, ensure existing tests still pass

2. **Run Code Quality**: 
   - Use `npm run lint` and `npm run format` to ensure code standards
   - Fix any linting or formatting issues before committing
   - Ensure TypeScript compilation is clean (`npm run typecheck`)

3. **Commit Your Work**: 
   - Create clear commit messages describing your implementation
   - Follow conventional commit format when possible
   - Include context about what was implemented and why

4. **Mark Task Complete**: 
   - Use `mcp__taskmaster-ai__set_task_status --id <your-task-id> --status done`
   - Ensure task status reflects completion accurately

5. **Document Integration**: 
   - Update task with implementation notes using `mcp__taskmaster-ai__update_task --id <your-task-id> --append --prompt "Work completed. Implementation details: [describe what was built and any important architectural decisions]"`
   - Include any important integration points for future tasks

#### Example Task Assignment Workflow:
```bash
# Check if task assigned via environment
if TASK_ID is set:
  - Use that task ID
else:
  - Call mcp__taskmaster-ai__get_tasks --status pending
  - Find first task where details doesn't contain "Assigned to claude-squad"
  - Call mcp__taskmaster-ai__update_task --id X --append --prompt "Assigned to claude-squad session-$(date +%s)"
  - Call mcp__taskmaster-ai__set_task_status --id X --status in-progress
  
# Then proceed with development work
```

### ⚠️ Important Task Management Reminders
- **Follow Dependencies**: Check which tasks must complete before yours
- **Test Thoroughly**: Your component will be integrated with others
- **Document Integration Points**: Help future tasks understand your interfaces
- **Stay Focused**: Work on assigned task only, avoid scope creep
- **Update Progress**: Use task management tools to communicate status

## MCP Development Standards

### 🎯 Development Guidelines

**Language**: TypeScript only with full type safety
**Transports**: Support both stdio and HTTP/SSE for MCP compatibility
**Testing**: Write comprehensive tests using Vitest framework
**Error Handling**: Implement graceful failures with clear, actionable messages
**Logging**: Use structured Pino logging for debugging and production monitoring
**Code Quality**: Follow ESLint/Prettier standards defined in project configuration

### 🏗️ TypeScript MCP Best Practices

#### Type Safety Requirements
- Use proper TypeScript interfaces for all MCP protocol types
- Implement full type safety throughout the codebase
- Define clear interfaces for tool inputs/outputs with Zod validation
- Use concrete event types for the event-driven system

#### MCP Protocol Compliance  
- Follow MCP specification for all client-server interactions
- Implement proper request/response schemas using `@modelcontextprotocol/sdk`
- Support both stdio and HTTP transports seamlessly
- Handle MCP notifications correctly for real-time updates

#### Architecture Patterns
- Use event-driven architecture for dynamic tool management
- Implement proper connection management and error recovery
- Cache tool definitions while supporting real-time updates
- Route requests without modifying their structure unnecessarily

### 📁 Project Structure Standards

Organize code in logical directories:
- `src/server/` - Core MCP server implementation
- `src/server/events/` - Event system for tool change notifications
- `src/server/tools/` - Tool implementations and registry
- `src/server/transports/` - Transport layer (stdio, HTTP)
- `src/server/resources/` - Resource management
- `src/utils/` - Logging, configuration, and utilities

### ✅ Implementation Checklist

Before completing any MCP-related task:

1. **Test Your Implementation**:
   - Run `npm test` and verify all tests pass
   - Ensure MCP protocol compliance with both transports
   - Test tool registration/execution through the event system
   - Verify logging output is structured and meaningful

2. **Code Quality**:
   - Run `npm run lint` and fix any issues
   - Run `npm run format` for consistent styling  
   - Ensure TypeScript compilation is clean (`npm run typecheck`)

3. **MCP Integration**:
   - Verify tools are properly registered in the tool registry
   - Test event emission for tool changes works correctly
   - Confirm MCP notifications are sent to clients
   - Validate both stdio and HTTP transports function properly

### 🔧 Key Components Reference

#### Event-Driven Tool System
- **ToolRegistry**: Dynamic tool registration with automatic event emission
- **McpEventEmitter**: Type-safe event emitter for tool change notifications  
- **ToolChangeEvent**: Concrete event types (`tool_added`, `tool_updated`, `tool_removed`)
- **MCP Notifications**: Automatic `notifications/tools/list_changed` to clients

#### Logging System
- **Pino Integration**: Structured logging with file and console output
- **Server Name Configuration**: Customize via `src/utils/logging.ts`
- **Log Levels**: Support for all standard levels (fatal, error, warn, info, debug, trace)
- **File Output**: Logs to `~/.toolprint/{server_name}/{server_name}.log`

#### Banner System
- **Toolprint Branding**: ASCII art banner using figlet
- **Consistent Styling**: Dark blue for Toolprint, light blue for app names
- **Auto-splitting**: Long app names split across multiple lines

## Essential TaskMaster Commands

### Core Workflow Commands

```bash
# Task Assignment & Progress
mcp__taskmaster-ai__get_tasks --status pending        # Find available tasks
mcp__taskmaster-ai__get_task --id <task-id>          # Get specific task details
mcp__taskmaster-ai__set_task_status --id <id> --status in-progress  # Start task
mcp__taskmaster-ai__set_task_status --id <id> --status done         # Complete task

# Task Updates & Documentation
mcp__taskmaster-ai__update_task --id <id> --append --prompt "notes"      # Add task notes
mcp__taskmaster-ai__update_subtask --id <id> --append --prompt "notes"   # Add subtask notes

# Analysis & Planning
mcp__taskmaster-ai__analyze_project_complexity --research     # Analyze task complexity
mcp__taskmaster-ai__expand_task --id <id> --research         # Break task into subtasks
```

### Task Structure & IDs

- Main tasks: `1`, `2`, `3`, etc.
- Subtasks: `1.1`, `1.2`, `2.1`, etc.
- Sub-subtasks: `1.1.1`, `1.1.2`, etc.

### Task Status Values

- `pending` - Ready to work on
- `in-progress` - Currently being worked on  
- `done` - Completed and verified
- `blocked` - Waiting on dependencies

## MCP Server Configuration

### Server Name Configuration

**IMPORTANT**: Update the server name in `src/utils/logging.ts`:

```typescript
export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  serverName: 'your-custom-server-name', // Change this!
  // ... rest of config
};
```

### Project Structure

```
src/
├── index.ts                 # Main CLI entrypoint
├── server/
│   ├── server.ts           # Core MCP server setup with event integration
│   ├── events/
│   │   ├── types.ts        # Event type definitions
│   │   ├── emitter.ts      # Type-safe event emitter
│   │   └── index.ts        # Event system exports and utilities
│   ├── transports/
│   │   ├── stdio.ts        # Stdio transport implementation
│   │   └── http.ts         # Express HTTP transport implementation
│   ├── tools/
│   │   ├── index.ts        # Tool exports and handlers
│   │   ├── registry.ts     # Dynamic tool registry with events
│   │   ├── hello-world.ts  # Hello world tool
│   │   ├── echo.ts         # Echo tool implementation
│   │   ├── health.ts       # Health check tool
│   │   └── dynamic-example.ts # Example dynamic tools
│   ├── resources/
│   │   ├── index.ts        # Resource provider
│   │   └── prompts.ts      # Prompt resource implementation
│   └── types/
│       └── schemas.ts      # Zod schemas for validation
├── resources/
│   └── prompts/
│       └── welcome.txt     # Static prompt content
└── utils/
    ├── logger.ts           # Logging utility (re-export)
    ├── logging.ts          # Pino-based logging implementation
    ├── banner.ts           # Toolprint ASCII banner system
    └── config.ts           # Configuration management
```

## Essential Development Workflow

### 1. Iterative Implementation

1. `mcp__taskmaster-ai__get_task --id <subtask-id>` - Understand requirements
2. Explore codebase and plan implementation
3. `mcp__taskmaster-ai__update_subtask --id <id> --append --prompt "detailed plan"` - Log plan
4. `mcp__taskmaster-ai__set_task_status --id <id> --status in-progress` - Start work
5. Implement code following logged plan
6. `mcp__taskmaster-ai__update_subtask --id <id> --append --prompt "implementation notes"` - Log progress
7. Test implementation thoroughly
8. `mcp__taskmaster-ai__set_task_status --id <id> --status done` - Complete task

### 2. Context Management

- Use `/clear` between different tasks to maintain focus
- This CLAUDE.md file is automatically loaded for context
- Use `mcp__taskmaster-ai__get_task --id <id>` to pull specific task context when needed

### 3. Quality Gates

Before marking any task complete:
- Run `npm test` and verify all tests pass
- Run `npm run lint` and `npm run format` 
- Ensure TypeScript compilation is clean (`npm run typecheck`)
- Test both stdio and HTTP transports if applicable

## Important Notes

### File Management
- Never manually edit `tasks.json` - use TaskMaster commands instead
- Task markdown files in `tasks/` are auto-generated
- Use `mcp__taskmaster-ai__generate` after manual changes to tasks.json

### Research Mode
- Add `--research` flag for research-based AI enhancement
- Requires a research model API key like Perplexity (`PERPLEXITY_API_KEY`) in environment
- Recommended for complex technical tasks

---

_This guide provides essential information for professional MCP server development with TaskMaster integration and multi-agent coordination._