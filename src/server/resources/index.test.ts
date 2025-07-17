import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceProvider } from './index.js';

describe('ResourceProvider', () => {
  let resourceProvider: ResourceProvider;

  beforeEach(() => {
    resourceProvider = new ResourceProvider();
  });

  it('should list available resources', () => {
    const resources = resourceProvider.listResources();
    
    expect(resources).toHaveLength(1);
    expect(resources[0]).toEqual({
      uri: 'prompt://welcome',
      name: 'Welcome',
      description: 'Welcome message and usage instructions for the MCP server',
      mimeType: 'text/plain',
    });
  });

  it('should check if resource exists', () => {
    expect(resourceProvider.hasResource('prompt://welcome')).toBe(true);
    expect(resourceProvider.hasResource('prompt://nonexistent')).toBe(false);
  });

  it('should get welcome resource', async () => {
    const resource = await resourceProvider.getResource('prompt://welcome');
    
    expect(resource).not.toBeNull();
    expect(resource!.content).toBeDefined();
    expect(resource!.mimeType).toBe('text/plain');
    expect(typeof resource!.content).toBe('string');
  });

  it('should return null for nonexistent resource', async () => {
    const resource = await resourceProvider.getResource('prompt://nonexistent');
    
    expect(resource).toBeNull();
  });
});