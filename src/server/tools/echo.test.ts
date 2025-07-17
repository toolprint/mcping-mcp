import { describe, it, expect } from 'vitest';
import { handleEcho } from './echo.js';
import { EchoInput } from '../types/schemas.js';

describe('Echo Tool', () => {
  it('should echo back the provided text', async () => {
    const input: EchoInput = { text: 'Hello, World!' };
    const result = await handleEcho(input);
    
    expect(result).toEqual({
      echo: 'Hello, World!',
    });
  });

  it('should handle different text inputs', async () => {
    const testCases = [
      'Simple text',
      'Text with numbers 123',
      'Special characters !@#$%',
      'Multi\nline\ntext',
    ];

    for (const testText of testCases) {
      const input: EchoInput = { text: testText };
      const result = await handleEcho(input);
      
      expect(result.echo).toBe(testText);
    }
  });

  it('should throw error for empty text', async () => {
    const input = { text: '' };
    
    await expect(handleEcho(input)).rejects.toThrow();
  });

  it('should throw error for missing text', async () => {
    const input = {} as EchoInput;
    
    await expect(handleEcho(input)).rejects.toThrow();
  });
});