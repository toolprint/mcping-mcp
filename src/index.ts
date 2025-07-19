#!/usr/bin/env node

import { Command } from 'commander';
import { McpServer } from './server/server.js';
import { StdioTransport } from './server/transports/stdio.js';
import { HttpTransport } from './server/transports/http.js';
import { ConfigManager } from './utils/config.js';
import { getLogger, STDIO_LOGGING_CONFIG, Logger } from './utils/logging.js';
import { displayBanner } from './utils/output.js';
import { APP_CONFIG } from './config/app.js';
import chalk from 'chalk';

// Always display banner before CLI processing for help/version commands
displayBanner(APP_CONFIG.appName);

// Create a global logger for error handlers
const globalLogger = getLogger();

const program = new Command();

program
  .name(APP_CONFIG.technicalName)
  .description(APP_CONFIG.description)
  .version(APP_CONFIG.version);

program
  .option(
    '-t, --transport <type>',
    'Transport type (stdio or http)',
    'stdio'
  )
  .option(
    '-p, --port <number>',
    'Port number for HTTP transport (default: 3000)',
    '3000'
  )
  .option(
    '--host <host>',
    'Host for HTTP transport (default: localhost)',
    'localhost'
  )
  .option(
    '-v, --verbose',
    'Enable verbose logging'
  );

program.action(async (options) => {
  // Initialize logger based on transport type
  const logger = options.transport === 'stdio' 
    ? getLogger(STDIO_LOGGING_CONFIG)  // only file-based logging for stdio transport
    : getLogger();
  
  try {

    // Show server configuration info for HTTP transport only
    // (stdio transport should be silent to avoid MCP protocol interference)
    if (options.transport === 'http') {
      
      console.log(chalk.blue.bold('Server Configuration:'));
      console.log(chalk.white(`  Transport: ${chalk.yellow(options.transport)}`));
      
      const port = parseInt(options.port, 10);
      console.log(chalk.white(`  Address:   ${chalk.yellow(`http://${options.host}:${port}`)}`));
      
      console.log(chalk.white(`  Version:   ${chalk.yellow(APP_CONFIG.version)}`));
      console.log(); // Extra spacing
    }

    // Validate transport option
    if (!['stdio', 'http'].includes(options.transport)) {
      logger.error('Invalid transport type. Must be "stdio" or "http"');
      process.exit(1);
    }

    // Validate port for HTTP transport
    const port = parseInt(options.port, 10);
    if (options.transport === 'http' && (isNaN(port) || port < 1 || port > 65535)) {
      logger.error('Invalid port number. Must be between 1 and 65535');
      process.exit(1);
    }

    // Set up configuration
    const config = new ConfigManager({
      transport: options.transport,
      port,
      host: options.host,
    });

    if (options.verbose) {
      process.env.NODE_ENV = 'development';
    }

    logger.info(`Starting MCP server with ${options.transport} transport...`);
    
    // Create MCP server instance
    const mcpServer = new McpServer();
    const server = mcpServer.getServer();

    let transport: StdioTransport | HttpTransport;

    // Start appropriate transport
    if (config.getTransport() === 'stdio') {
      transport = new StdioTransport(server);
      await transport.start();
    } else {
      transport = new HttpTransport(
        server,
        config.getPort(),
        config.getHost()
      );
      await transport.start();
    }

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      try {
        await transport.stop();
        logger.info('Server shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle various termination signals
    process.on('SIGINT', () => {
      shutdown('SIGINT');
      // Force exit after timeout if graceful shutdown fails
      setTimeout(() => {
        logger.warn('Force exit after timeout');
        process.exit(1);
      }, 3000);
    });
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  globalLogger.error('Unhandled Rejection', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  globalLogger.error('Uncaught Exception:', error);
  process.exit(1);
});


program.parse();