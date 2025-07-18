import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { notificationTool, handleNotification } from './notification.js';

export const tools: Tool[] = [notificationTool];

export const toolHandlers = {
  'send-notification': handleNotification,
};

export { notificationTool };
export { handleNotification };