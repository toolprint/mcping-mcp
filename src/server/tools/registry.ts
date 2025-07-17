import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { mcpEventEmitter } from '../events/emitter.js';
import { ToolChangeEvent } from '../events/types.js';
import { logger } from '../../utils/logger.js';

export interface ToolHandler {
  (args: any): Promise<any>;
}

export interface RegistryTool extends Tool {
  handler: ToolHandler;
}

/**
 * Dynamic tool registry that emits change events
 */
export class ToolRegistry {
  private tools = new Map<string, RegistryTool>();

  /**
   * Register a new tool
   */
  register(tool: RegistryTool): void {
    const existingTool = this.tools.get(tool.name);
    
    this.tools.set(tool.name, tool);
    
    const event: ToolChangeEvent = {
      type: existingTool ? 'tool_updated' : 'tool_added',
      toolName: tool.name,
      timestamp: Date.now(),
      metadata: {
        description: tool.description,
        inputSchema: tool.inputSchema,
        reason: existingTool ? 'Tool definition updated' : 'New tool registered'
      }
    };

    logger.info(`Tool ${event.type}: ${tool.name}`);
    mcpEventEmitter.emit('toolChange', event);
  }

  /**
   * Unregister a tool
   */
  unregister(toolName: string): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return false;
    }

    this.tools.delete(toolName);

    const event: ToolChangeEvent = {
      type: 'tool_removed',
      toolName,
      timestamp: Date.now(),
      metadata: {
        reason: 'Tool unregistered'
      }
    };

    logger.info(`Tool removed: ${toolName}`);
    mcpEventEmitter.emit('toolChange', event);
    return true;
  }

  /**
   * Get a tool by name
   */
  get(toolName: string): RegistryTool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Get all registered tools
   */
  getAll(): RegistryTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tool names
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool is registered
   */
  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get tool count
   */
  size(): number {
    return this.tools.size;
  }

  /**
   * Clear all tools
   */
  clear(): void {
    const toolNames = this.getNames();
    this.tools.clear();

    // Emit removal events for all tools
    toolNames.forEach(toolName => {
      const event: ToolChangeEvent = {
        type: 'tool_removed',
        toolName,
        timestamp: Date.now(),
        metadata: {
          reason: 'Registry cleared'
        }
      };

      mcpEventEmitter.emit('toolChange', event);
    });

    logger.info('Tool registry cleared');
  }
}

// Global tool registry instance
export const toolRegistry = new ToolRegistry();