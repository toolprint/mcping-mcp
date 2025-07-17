/**
 * Event system exports for easy importing
 */

export { McpEventEmitter, mcpEventEmitter } from './emitter.js';
export { ToolChangeEvent, EventMap, EventType, EventData } from './types.js';
export { ToolRegistry, toolRegistry } from '../tools/registry.js';

/**
 * Utility functions for tools to emit change events
 */

import { mcpEventEmitter } from './emitter.js';
import { ToolChangeEvent } from './types.js';

/**
 * Emit a tool added event
 */
export function emitToolAdded(
  toolName: string, 
  metadata?: ToolChangeEvent['metadata']
): void {
  mcpEventEmitter.emit('toolChange', {
    type: 'tool_added',
    toolName,
    timestamp: Date.now(),
    metadata
  });
}

/**
 * Emit a tool updated event
 */
export function emitToolUpdated(
  toolName: string, 
  metadata?: ToolChangeEvent['metadata']
): void {
  mcpEventEmitter.emit('toolChange', {
    type: 'tool_updated',
    toolName,
    timestamp: Date.now(),
    metadata
  });
}

/**
 * Emit a tool removed event
 */
export function emitToolRemoved(
  toolName: string, 
  metadata?: ToolChangeEvent['metadata']
): void {
  mcpEventEmitter.emit('toolChange', {
    type: 'tool_removed',
    toolName,
    timestamp: Date.now(),
    metadata
  });
}