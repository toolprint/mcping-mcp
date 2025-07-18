#!/usr/bin/env node

/**
 * MCPing - MCP server binary entrypoint
 * This handles the process lifecycle for running as an executable
 */

// Handle process exit to ensure clean shutdown
process.on('exit', (code) => {
  if (code === 0) {
    process.exit(0);
  }
});

// Catch unhandled errors to prevent silent failures
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Import and run the main CLI
import('./index.js').catch((error) => {
  console.error('Failed to start MCPing:', error);
  process.exit(1);
});