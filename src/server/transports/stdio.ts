import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { logger } from '../../utils/logger.js';

export class StdioTransport {
  private transport: StdioServerTransport;

  constructor(private server: Server) {
    this.transport = new StdioServerTransport();
    logger.debug('Stdio transport initialized');
  }

  async start(): Promise<void> {
    logger.debug('Starting stdio transport...');
    
    try {
      await this.server.connect(this.transport);
      logger.debug('Stdio transport started successfully');
      
      // Keep the process alive
      process.on('SIGINT', () => {
        logger.debug('Received SIGINT, shutting down stdio transport...');
        this.stop();
      });

      process.on('SIGTERM', () => {
        logger.debug('Received SIGTERM, shutting down stdio transport...');
        this.stop();
      });

    } catch (error) {
      logger.error('Failed to start stdio transport:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.debug('Stopping stdio transport...');
    try {
      await this.server.close();
      logger.debug('Stdio transport stopped successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error stopping stdio transport:', error);
      process.exit(1);
    }
  }
}