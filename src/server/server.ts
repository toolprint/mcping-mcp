import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, toolHandlers } from './tools/index.js';
import { ResourceProvider } from './resources/index.js';
import { logger } from '../utils/logger.js';
import { mcpEventEmitter } from './events/emitter.js';
import { toolRegistry } from './tools/registry.js';
import { ToolChangeEvent } from './events/types.js';
import { APP_CONFIG } from '../config/app.js';

export class McpServer {
  private server: Server;
  private resourceProvider: ResourceProvider;
  private toolChangeListener: ((event: ToolChangeEvent) => void) | null = null;

  constructor() {
    this.server = new Server(
      {
        name: APP_CONFIG.technicalName,
        version: APP_CONFIG.version,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.resourceProvider = new ResourceProvider();
    this.setupHandlers();
    this.setupEventListeners();
    this.initializeTools();
    logger.info('MCP Server initialized successfully');
  }

  private setupHandlers(): void {
    // Tool handling
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Handling list_tools request');
      const registryTools = toolRegistry.getAll();
      return {
        tools: registryTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info(`Handling call_tool request for: ${name}`, { 
        toolName: name, 
        arguments: args 
      });

      const tool = toolRegistry.get(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        const result = await tool.handler(args || {});
        logger.info(`Tool execution completed: ${name}`, { 
          toolName: name, 
          success: true 
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        throw new Error(`Tool execution failed: ${error}`);
      }
    });

    // Resource handling
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      logger.debug('Handling list_resources request');
      const resources = this.resourceProvider.listResources();
      return {
        resources: resources.map((resource) => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        })),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      logger.debug(`Handling read_resource request for: ${uri}`);

      const resource = await this.resourceProvider.getResource(uri);
      if (!resource) {
        throw new Error(`Resource not found: ${uri}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType || 'text/plain',
            text: resource.content,
          },
        ],
      };
    });
  }

  /**
   * Set up event listeners for tool changes
   */
  private setupEventListeners(): void {
    // Store the listener reference so we can remove it later
    this.toolChangeListener = (event: ToolChangeEvent) => {
      logger.debug(`Tool change event received: ${event.type} for ${event.toolName}`);
      // Only try to notify if server is connected
      if (this.isConnected()) {
        this.notifyToolsChanged(event);
      }
    };
    
    mcpEventEmitter.on('toolChange', this.toolChangeListener);
  }

  /**
   * Initialize tools from the existing tools module
   */
  private initializeTools(): void {
    // Register existing tools in the registry
    tools.forEach(tool => {
      const handler = toolHandlers[tool.name as keyof typeof toolHandlers];
      if (typeof handler === 'function') {
        toolRegistry.register({
          ...tool,
          handler
        });
      }
    });
  }

  /**
   * Check if server is connected to a transport
   */
  private isConnected(): boolean {
    // The server's transport property indicates if it's connected
    return (this.server as any).transport !== undefined;
  }

  /**
   * Send MCP tools list change notification to clients (only when connected)
   */
  private notifyToolsChanged(event: ToolChangeEvent): void {
    try {
      // Use the standard MCP notification method
      // Note: In practice, tools/list_changed notifications might not be part of the standard
      // This is more for demonstration of the event system
      this.server.notification({
        method: 'notifications/tools/list_changed',
        params: {
          type: event.type,
          toolName: event.toolName,
          timestamp: event.timestamp
        }
      });
      
      logger.debug(`Sent tools list change notification for: ${event.toolName}`);
    } catch (error) {
      logger.debug('Could not send tools list change notification (server may not be connected):', error);
    }
  }

  /**
   * Get the tool registry for external tool management
   */
  getToolRegistry() {
    return toolRegistry;
  }

  getServer(): Server {
    return this.server;
  }

  async close(): Promise<void> {
    logger.info('Closing MCP Server');
    await this.server.close();
  }
}