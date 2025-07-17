import { describe, it, expect } from 'vitest';
import { handleHealth } from './health.js';
import { HealthInput } from '../types/schemas.js';

describe('Health Tool', () => {
  it('should return green status', async () => {
    const input: HealthInput = {};
    const result = await handleHealth(input);
    
    expect(result).toEqual({
      status: 'green',
    });
  });

  it('should handle empty input gracefully', async () => {
    const result = await handleHealth({});
    
    expect(result.status).toBeDefined();
    expect(['green', 'yellow', 'red']).toContain(result.status);
  });
});