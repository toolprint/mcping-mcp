/**
 * Example of a dynamic tool that can be added/removed at runtime
 * This demonstrates how the event system works
 */

import { toolRegistry } from './registry.js';
import { getLogger } from '../../utils/logging.js';

const logger = getLogger();

/**
 * Example dynamic tool: Calculator
 */
export const calculatorTool = {
  name: 'calculator',
  description: 'Perform basic mathematical calculations',
  inputSchema: {
    type: 'object' as const,
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The mathematical operation to perform'
      },
      a: {
        type: 'number',
        description: 'First number'
      },
      b: {
        type: 'number',
        description: 'Second number'
      }
    },
    required: ['operation', 'a', 'b']
  },
  handler: async (args: { operation: string; a: number; b: number }) => {
    const { operation, a, b } = args;
    
    switch (operation) {
      case 'add':
        return { result: a + b, operation: `${a} + ${b}` };
      case 'subtract':
        return { result: a - b, operation: `${a} - ${b}` };
      case 'multiply':
        return { result: a * b, operation: `${a} × ${b}` };
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        return { result: a / b, operation: `${a} ÷ ${b}` };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
};

/**
 * Example dynamic tool: Random Number Generator
 */
export const randomTool = {
  name: 'random-number',
  description: 'Generate a random number within a specified range',
  inputSchema: {
    type: 'object' as const,
    properties: {
      min: {
        type: 'number',
        description: 'Minimum value (inclusive)',
        default: 0
      },
      max: {
        type: 'number',
        description: 'Maximum value (inclusive)',
        default: 100
      }
    },
    required: []
  },
  handler: async (args: { min?: number; max?: number } = {}) => {
    const min = args.min ?? 0;
    const max = args.max ?? 100;
    
    if (min > max) {
      throw new Error('Minimum value cannot be greater than maximum value');
    }
    
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    return { 
      result, 
      range: `${min} to ${max}`,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Dynamic tool management functions
 */
export class DynamicToolManager {
  
  /**
   * Add the calculator tool
   */
  static addCalculator(): void {
    toolRegistry.register(calculatorTool);
    logger.info('Calculator tool added dynamically');
  }

  /**
   * Remove the calculator tool
   */
  static removeCalculator(): void {
    toolRegistry.unregister('calculator');
    logger.info('Calculator tool removed dynamically');
  }

  /**
   * Add the random number generator tool
   */
  static addRandomTool(): void {
    toolRegistry.register(randomTool);
    logger.info('Random number generator tool added dynamically');
  }

  /**
   * Remove the random number generator tool
   */
  static removeRandomTool(): void {
    toolRegistry.unregister('random-number');
    logger.info('Random number generator tool removed dynamically');
  }

  /**
   * Update a tool's description (demonstrates tool_updated event)
   */
  static updateCalculatorDescription(): void {
    const updatedTool = {
      ...calculatorTool,
      description: 'Perform basic mathematical calculations with enhanced precision'
    };
    
    toolRegistry.register(updatedTool);
    logger.info('Calculator tool description updated');
  }

  /**
   * Get all available dynamic tools
   */
  static getAvailableTools(): string[] {
    return ['calculator', 'random-number'];
  }

  /**
   * Get current tool count
   */
  static getToolCount(): number {
    return toolRegistry.size();
  }
}