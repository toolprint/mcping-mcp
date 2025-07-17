import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpEventEmitter } from './emitter.js';
import { ToolRegistry } from '../tools/registry.js';
import { ToolChangeEvent } from './types.js';
import { mcpEventEmitter } from './emitter.js';

describe('Event System', () => {
  let eventEmitter: McpEventEmitter;

  beforeEach(() => {
    eventEmitter = new McpEventEmitter();
  });

  describe('McpEventEmitter', () => {
    it('should emit and listen to typed events', () => {
      const listener = vi.fn();
      
      eventEmitter.on('toolChange', listener);
      
      const event: ToolChangeEvent = {
        type: 'tool_added',
        toolName: 'test-tool',
        timestamp: Date.now(),
        metadata: { description: 'Test tool' }
      };
      
      eventEmitter.emit('toolChange', event);
      
      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should support once listeners', () => {
      const listener = vi.fn();
      
      eventEmitter.once('toolChange', listener);
      
      const event: ToolChangeEvent = {
        type: 'tool_added',
        toolName: 'test-tool',
        timestamp: Date.now()
      };
      
      eventEmitter.emit('toolChange', event);
      eventEmitter.emit('toolChange', event);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('ToolRegistry Integration', () => {
    let toolRegistry: ToolRegistry;
    let listener: any;

    beforeEach(() => {
      toolRegistry = new ToolRegistry();
      listener = vi.fn();
      // Listen to the global emitter that ToolRegistry uses
      mcpEventEmitter.on('toolChange', listener);
    });

    afterEach(() => {
      // Clean up listeners
      mcpEventEmitter.removeAllListeners('toolChange');
      toolRegistry.clear();
    });

    it('should emit tool_added event when registering new tool', () => {
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object' as const },
        handler: vi.fn()
      };

      toolRegistry.register(tool);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tool_added',
          toolName: 'test-tool'
        })
      );
    });

    it('should emit tool_updated event when updating existing tool', () => {
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object' as const },
        handler: vi.fn()
      };

      // Register tool first
      toolRegistry.register(tool);
      listener.mockClear();
      
      // Register again with different description
      toolRegistry.register({
        ...tool,
        description: 'Updated test tool'
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tool_updated',
          toolName: 'test-tool'
        })
      );
    });

    it('should emit tool_removed event when unregistering tool', () => {
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object' as const },
        handler: vi.fn()
      };

      toolRegistry.register(tool);
      listener.mockClear();
      
      toolRegistry.unregister('test-tool');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tool_removed',
          toolName: 'test-tool'
        })
      );
    });
  });
});