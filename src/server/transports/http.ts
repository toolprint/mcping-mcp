import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { randomUUID } from 'node:crypto';
import { getLogger } from '../../utils/logging.js';
import { APP_CONFIG } from '../../config/app.js';
import { ServerTransport } from './types.js';

const logger = getLogger()

export class HttpTransport implements ServerTransport {
  private app: express.Application;
  private server: any;
  private mcpServer: Server;
  private port: number;
  private host: string;
  private transport: StreamableHTTPServerTransport;

  constructor(mcpServer: Server, port: number = 3000, host: string = 'localhost') {
    this.mcpServer = mcpServer;
    this.port = port;
    this.host = host;
    this.app = express();

    // Create a single transport instance
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID()
    });

    this.setupMiddleware();
    this.setupRoutes();
    logger.info(`HTTP transport initialized on ${host}:${port}`);
  }

  private setupMiddleware(): void {
    // Enable CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Parse JSON bodies
    this.app.use(express.json());

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        server: APP_CONFIG.technicalName,
        timestamp: new Date().toISOString(),
      });
    });

    // MCP endpoint using Streamable HTTP transport
    this.app.post('/mcp', async (req, res) => {
      logger.debug('Handling MCP Streamable HTTP POST request', {
        method: req.body?.method,
        id: req.body?.id
      });

      try {
        // Use the single transport instance to handle the request
        await this.transport.handleRequest(req, res, req.body);

        logger.debug('MCP Streamable HTTP request handled successfully');
      } catch (error) {
        logger.error('Error handling MCP Streamable HTTP request:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to handle MCP request' });
        }
      }
    });

    // Handle GET requests for server-to-client notifications (StreamableHTTP)
    this.app.get('/mcp', async (req, res) => {
      logger.debug('Handling MCP Streamable HTTP GET request');

      try {
        // Use the single transport instance to handle GET requests
        await this.transport.handleRequest(req, res, undefined);

        logger.debug('MCP Streamable HTTP GET request handled successfully');
      } catch (error) {
        logger.error('Error handling MCP GET request:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to handle MCP request' });
        }
      }
    });

    // Root endpoint with basic info
    this.app.get('/', (req, res) => {
      res.json({
        name: APP_CONFIG.appName,
        version: APP_CONFIG.version,
        transport: 'streamable-http',
        endpoints: {
          health: '/health',
          mcp: '/mcp',
        },
        status: 'ready',
      });
    });
  }

  async start(): Promise<void> {
    // Connect the MCP server to the transport
    await this.mcpServer.connect(this.transport);

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, () => {
        logger.info(`Streamable HTTP transport started on http://${this.host}:${this.port}`);
        logger.info('Available endpoints:');
        logger.info(`  - Health: http://${this.host}:${this.port}/health`);
        logger.info(`  - MCP Streamable HTTP: http://${this.host}:${this.port}/mcp`);
        logger.info(`  - Server Info: http://${this.host}:${this.port}/`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        logger.error('HTTP server error:', error);
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        // Close the server and all connections
        this.server.close(() => {
          logger.info('Streamable HTTP transport stopped successfully');
          resolve();
        });

        // Force close all connections after a timeout
        setTimeout(() => {
          if (this.server) {
            this.server.closeAllConnections?.();
          }
          resolve();
        }, 1000);
      } else {
        resolve();
      }
    });
  }
}