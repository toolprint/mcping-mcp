/**
 * Event types for the MCP server event system
 */

export interface ToolChangeEvent {
  type: 'tool_added' | 'tool_removed' | 'tool_updated';
  toolName: string;
  timestamp: number;
  metadata?: {
    description?: string;
    inputSchema?: any;
    reason?: string;
  };
}

export interface EventMap {
  toolChange: ToolChangeEvent;
}

export type EventType = keyof EventMap;
export type EventData<T extends EventType> = EventMap[T];