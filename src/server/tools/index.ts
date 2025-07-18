import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { helloWorldTool, handleHelloWorld } from './hello-world.js';
import { echoTool, handleEcho } from './echo.js';
import { healthTool, handleHealth } from './health.js';
import { notificationTool, handleNotification } from './notification.js';

export const tools: Tool[] = [helloWorldTool, echoTool, healthTool, notificationTool];

export const toolHandlers = {
  'hello-world': handleHelloWorld,
  echo: handleEcho,
  health: handleHealth,
  'send-notification': handleNotification,
};

export { helloWorldTool, echoTool, healthTool, notificationTool };
export { handleHelloWorld, handleEcho, handleHealth, handleNotification };