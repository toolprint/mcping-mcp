import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  HealthInput,
  HealthOutput,
  HealthInputSchema,
  HealthOutputSchema,
} from '../types/schemas.js';
import { logger } from '../../utils/logger.js';

export const healthTool: Tool = {
  name: 'health',
  description: 'Returns server health status',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  outputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['green', 'yellow', 'red'],
        description: 'The health status of the server (green=healthy, yellow=warning, red=error)',
      },
    },
    required: ['status'],
  },
};

export async function handleHealth(input: HealthInput): Promise<HealthOutput> {
  logger.debug('Executing health tool');
  
  // Validate input (though it's empty for this tool)
  HealthInputSchema.parse(input);

  const output: HealthOutput = {
    status: 'green',
  };

  // Validate output
  HealthOutputSchema.parse(output);
  
  logger.debug('Health tool executed successfully');
  return output;
}