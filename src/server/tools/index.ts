import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { helloWorldTool, handleHelloWorld } from './hello-world.js';
import { echoTool, handleEcho } from './echo.js';
import { healthTool, handleHealth } from './health.js';

export const tools: Tool[] = [helloWorldTool, echoTool, healthTool];

export const toolHandlers = {
  'hello-world': handleHelloWorld,
  echo: handleEcho,
  health: handleHealth,
};

export { helloWorldTool, echoTool, healthTool };
export { handleHelloWorld, handleEcho, handleHealth };