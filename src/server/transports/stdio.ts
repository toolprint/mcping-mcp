import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { getLogger, STDIO_LOGGING_CONFIG } from '../../utils/logging.js';

export class StdioTransport {
  private transport: StdioServerTransport;
  private logger = getLogger(STDIO_LOGGING_CONFIG);

  constructor(private server: Server) {
    this.transport = new StdioServerTransport();
    this.logger.debug('Stdio transport initialized');
  }

  async start(): Promise<void> {
    this.logger.debug('Starting stdio transport...');
    
    try {
      await this.server.connect(this.transport);
      this.logger.debug('Stdio transport started successfully');
      
      // Keep the process alive
      process.on('SIGINT', () => {
        this.logger.debug('Received SIGINT, shutting down stdio transport...');
        this.stop();
      });

      process.on('SIGTERM', () => {
        this.logger.debug('Received SIGTERM, shutting down stdio transport...');
        this.stop();
      });

    } catch (error) {
      this.logger.error('Failed to start stdio transport:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.logger.debug('Stopping stdio transport...');
    try {
      await this.server.close();
      this.logger.debug('Stdio transport stopped successfully');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error stopping stdio transport:', error);
      process.exit(1);
    }
  }
}