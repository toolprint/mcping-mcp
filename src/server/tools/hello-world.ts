import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  HelloWorldInput,
  HelloWorldOutput,
  HelloWorldInputSchema,
  HelloWorldOutputSchema,
} from '../types/schemas.js';
import { logger } from '../../utils/logger.js';
import { APP_CONFIG } from '../../config/app.js';

export const helloWorldTool: Tool = {
  name: 'hello-world',
  description: 'Returns a simple greeting message',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  outputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The greeting message from the server',
      },
    },
    required: ['message'],
  },
};

export async function handleHelloWorld(input: HelloWorldInput): Promise<HelloWorldOutput> {
  logger.debug('Executing hello-world tool');
  
  // Validate input (though it's empty for this tool)
  HelloWorldInputSchema.parse(input);

  const output: HelloWorldOutput = {
    message: `Hello from ${APP_CONFIG.appName}!`,
  };

  // Validate output
  HelloWorldOutputSchema.parse(output);
  
  logger.debug('Hello-world tool executed successfully');
  return output;
}