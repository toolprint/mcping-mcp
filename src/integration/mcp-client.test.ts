import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join } from 'path';
import { APP_CONFIG } from '../config/app.js';

// Use path resolution that works with both CommonJS and ES modules
const __dirname = process.cwd();

describe('MCP Client Integration Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    // Create client transport that will spawn the server process
    const serverPath = join(__dirname, 'dist/index.js');
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath, '--transport', 'stdio']
    });

    // Create MCP client
    client = new Client(
      {
        name: 'integration-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect client to server
    await client.connect(transport);

    console.log('MCP client connected successfully');
  }, 10000);

  afterAll(async () => {
    // Clean up
    if (client) {
      await client.close();
    }
  });

  describe('Tool Operations', () => {
    test('should list available tools', async () => {
      const tools = await client.listTools();
      
      expect(tools).toBeDefined();
      expect(tools.tools).toHaveLength(3);
      
      const toolNames = tools.tools.map(tool => tool.name);
      expect(toolNames).toContain('hello-world');
      expect(toolNames).toContain('echo');
      expect(toolNames).toContain('health');

      // Check tool schemas
      const helloWorldTool = tools.tools.find(t => t.name === 'hello-world');
      expect(helloWorldTool).toBeDefined();
      expect(helloWorldTool!.description).toBe('Returns a simple greeting message');
      expect(helloWorldTool!.inputSchema).toBeDefined();

      const echoTool = tools.tools.find(t => t.name === 'echo');
      expect(echoTool).toBeDefined();
      expect(echoTool!.description).toBe('Echoes back the provided text');
      expect((echoTool!.inputSchema as any).properties?.text).toBeDefined();

      console.log('Available tools:', tools.tools);
    });

    test('should call hello-world tool successfully', async () => {
      const result = await client.callTool({
        name: 'hello-world',
        arguments: {},
      });

      expect(result).toBeDefined();
      expect((result as any).content).toHaveLength(1);
      expect((result as any).content[0].type).toBe('text');
      
      const responseText = (result as any).content[0].text;
      const parsedResponse = JSON.parse(responseText);
      
      expect(parsedResponse).toEqual({
        message: `Hello from ${APP_CONFIG.appName}!`,
      });

      console.log('Hello-world tool response:', parsedResponse);
    });

    test('should call echo tool with text input', async () => {
      const testText = 'Integration test message';
      
      const result = await client.callTool({
        name: 'echo',
        arguments: {
          text: testText,
        },
      });

      expect(result).toBeDefined();
      expect((result as any).content).toHaveLength(1);
      expect((result as any).content[0].type).toBe('text');
      
      const responseText = (result as any).content[0].text;
      const parsedResponse = JSON.parse(responseText);
      
      expect(parsedResponse).toEqual({
        echo: testText,
      });

      console.log('Echo tool response:', parsedResponse);
    });

    test('should call health tool successfully', async () => {
      const result = await client.callTool({
        name: 'health',
        arguments: {},
      });

      expect(result).toBeDefined();
      expect((result as any).content).toHaveLength(1);
      expect((result as any).content[0].type).toBe('text');
      
      const responseText = (result as any).content[0].text;
      const parsedResponse = JSON.parse(responseText);
      
      expect(parsedResponse).toEqual({
        status: 'green',
      });

      console.log('Health tool response:', parsedResponse);
    });

    test('should handle invalid tool name gracefully', async () => {
      await expect(
        client.callTool({
          name: 'nonexistent-tool',
          arguments: {},
        })
      ).rejects.toThrow();
    });

    test('should handle invalid echo tool arguments', async () => {
      await expect(
        client.callTool({
          name: 'echo',
          arguments: {
            text: '',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Resource Operations', () => {
    test('should list available resources', async () => {
      const resources = await client.listResources();
      
      expect(resources).toBeDefined();
      expect(resources.resources).toHaveLength(1);
      
      const resource = resources.resources[0];
      expect(resource.uri).toBe('prompt://welcome');
      expect(resource.name).toBe('Welcome');
      expect(resource.description).toBe('Welcome message and usage instructions for the MCP server');
      expect(resource.mimeType).toBe('text/plain');

      console.log('Available resources:', resources.resources);
    });

    test('should read welcome resource', async () => {
      const resource = await client.readResource({
        uri: 'prompt://welcome',
      });

      expect(resource).toBeDefined();
      expect(resource.contents).toHaveLength(1);
      
      const content = resource.contents[0];
      expect(content.uri).toBe('prompt://welcome');
      expect(content.mimeType).toBe('text/plain');
      expect(content.text).toBeDefined();
      expect(content.text).toContain(`Welcome to the ${APP_CONFIG.appName}!`);
      expect(content.text).toContain('Available tools:');

      console.log('Welcome resource content:', content.text);
    });

    test('should handle invalid resource URI gracefully', async () => {
      await expect(
        client.readResource({
          uri: 'prompt://nonexistent',
        })
      ).rejects.toThrow();
    });
  });

  describe('Complete Workflow', () => {
    test('should perform a complete client-server interaction workflow', async () => {
      // 1. List tools
      const tools = await client.listTools();
      expect(tools.tools).toHaveLength(3);

      // 2. List resources
      const resources = await client.listResources();
      expect(resources.resources).toHaveLength(1);

      // 3. Read welcome resource
      const welcomeResource = await client.readResource({
        uri: 'prompt://welcome',
      });
      expect(welcomeResource.contents[0].text).toContain('Welcome');

      // 4. Check server health
      const healthResult = await client.callTool({
        name: 'health',
        arguments: {},
      });
      const healthResponse = JSON.parse((healthResult as any).content[0].text);
      expect(healthResponse.status).toBe('green');

      // 5. Use echo tool with dynamic content
      const dynamicMessage = `Test message at ${new Date().toISOString()}`;
      const echoResult = await client.callTool({
        name: 'echo',
        arguments: {
          text: dynamicMessage,
        },
      });
      const echoResponse = JSON.parse((echoResult as any).content[0].text);
      expect(echoResponse.echo).toBe(dynamicMessage);

      // 6. Get greeting
      const greetingResult = await client.callTool({
        name: 'hello-world',
        arguments: {},
      });
      const greetingResponse = JSON.parse((greetingResult as any).content[0].text);
      expect(greetingResponse.message).toBe(`Hello from ${APP_CONFIG.appName}!`);

      console.log('Complete workflow test passed successfully!');
    });
  });
});