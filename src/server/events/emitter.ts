import { EventEmitter } from 'events';
import { EventMap, EventType, EventData } from './types.js';
import { logger } from '../../utils/logger.js';

/**
 * Type-safe event emitter for MCP server events
 */
export class McpEventEmitter extends EventEmitter {
  
  /**
   * Emit a typed event
   */
  emit<T extends EventType>(event: T, data: EventData<T>): boolean {
    logger.debug(`Emitting event: ${event}`, { event, data });
    return super.emit(event, data);
  }

  /**
   * Listen for a typed event
   */
  on<T extends EventType>(
    event: T,
    listener: (data: EventData<T>) => void
  ): this {
    return super.on(event, listener);
  }

  /**
   * Listen for a typed event once
   */
  once<T extends EventType>(
    event: T,
    listener: (data: EventData<T>) => void
  ): this {
    return super.once(event, listener);
  }

  /**
   * Remove a typed event listener
   */
  off<T extends EventType>(
    event: T,
    listener: (data: EventData<T>) => void
  ): this {
    return super.off(event, listener);
  }
}

// Global event emitter instance
export const mcpEventEmitter = new McpEventEmitter();