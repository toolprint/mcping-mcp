import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  EchoInput,
  EchoOutput,
  EchoInputSchema,
  EchoOutputSchema,
} from '../types/schemas.js';
import { logger } from '../../utils/logger.js';

export const echoTool: Tool = {
  name: 'echo',
  description: 'Echoes back the provided text',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to echo back',
        minLength: 1,
      },
    },
    required: ['text'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      echo: {
        type: 'string',
        description: 'The echoed text, identical to the input',
      },
    },
    required: ['echo'],
  },
};

export async function handleEcho(input: EchoInput): Promise<EchoOutput> {
  logger.debug('Executing echo tool with input:', input);
  
  // Validate input
  const validatedInput = EchoInputSchema.parse(input);

  const output: EchoOutput = {
    echo: validatedInput.text,
  };

  // Validate output
  EchoOutputSchema.parse(output);
  
  logger.debug('Echo tool executed successfully');
  return output;
}