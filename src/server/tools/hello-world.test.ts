import { describe, it, expect } from 'vitest';
import { handleHelloWorld } from './hello-world.js';
import { APP_CONFIG } from '../../config/app.js';
import { HelloWorldInput } from '../types/schemas.js';

describe('Hello World Tool', () => {
  it('should return a greeting message', async () => {
    const input: HelloWorldInput = {};
    const result = await handleHelloWorld(input);
    
    expect(result).toEqual({
      message: `Hello from ${APP_CONFIG.appName}!`,
    });
  });

  it('should handle empty input gracefully', async () => {
    const result = await handleHelloWorld({});
    
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
  });
});