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
      expect(tools.tools).toHaveLength(1);
      
      const toolNames = tools.tools.map(tool => tool.name);
      expect(toolNames).toContain('send-notification');

      // Check notification tool schema
      const notificationTool = tools.tools.find(t => t.name === 'send-notification');
      expect(notificationTool).toBeDefined();
      expect(notificationTool!.description).toBe('Send a desktop notification on macOS with icon, image, and sound customization');
      expect(notificationTool!.inputSchema).toBeDefined();
      expect((notificationTool!.inputSchema as any).properties?.title).toBeDefined();
      expect((notificationTool!.inputSchema as any).properties?.message).toBeDefined();
      expect((notificationTool!.inputSchema as any).properties?.subtitle).toBeDefined();
      expect((notificationTool!.inputSchema as any).properties?.urgency).toBeDefined();

      console.log('Available tools:', tools.tools);
    });

    test('should call send-notification tool successfully', async () => {
      const result = await client.callTool({
        name: 'send-notification',
        arguments: {
          title: 'Integration Test',
          message: 'Testing notification functionality',
          subtitle: 'Test Suite',
          urgency: 'normal',
        },
      });

      expect(result).toBeDefined();
      expect((result as any).content).toHaveLength(1);
      expect((result as any).content[0].type).toBe('text');
      
      const responseText = (result as any).content[0].text;
      const parsedResponse = JSON.parse(responseText);
      
      expect(parsedResponse.success).toBe(true);
      expect(parsedResponse.notificationId).toBeDefined();
      expect(parsedResponse.timestamp).toBeDefined();

      console.log('Send-notification tool response:', parsedResponse);
    });

    test('should handle invalid tool name gracefully', async () => {
      await expect(
        client.callTool({
          name: 'nonexistent-tool',
          arguments: {},
        })
      ).rejects.toThrow();
    });

    test('should handle invalid notification tool arguments', async () => {
      const result = await client.callTool({
        name: 'send-notification',
        arguments: {
          title: '', // Empty title should fail
          message: 'Test message',
        },
      });
      
      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Title is required and cannot be empty');
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
      expect(tools.tools).toHaveLength(1);

      // 2. List resources
      const resources = await client.listResources();
      expect(resources.resources).toHaveLength(1);

      // 3. Read welcome resource
      const welcomeResource = await client.readResource({
        uri: 'prompt://welcome',
      });
      expect(welcomeResource.contents[0].text).toContain('Welcome');

      // 4. Test notification tool with different urgency levels
      const urgencyLevels = ['low', 'normal', 'critical'] as const;
      
      for (const urgency of urgencyLevels) {
        const notificationResult = await client.callTool({
          name: 'send-notification',
          arguments: {
            title: `Integration Test - ${urgency.toUpperCase()}`,
            message: `Testing ${urgency} urgency notification at ${new Date().toISOString()}`,
            subtitle: 'Workflow Test',
            urgency: urgency,
          },
        });
        
        const notificationResponse = JSON.parse((notificationResult as any).content[0].text);
        expect(notificationResponse.success).toBe(true);
        expect(notificationResponse.notificationId).toBeDefined();
        expect(notificationResponse.timestamp).toBeDefined();
        
        console.log(`${urgency} urgency notification sent:`, notificationResponse.notificationId);
      }

      console.log('Complete workflow test passed successfully!');
    });
  });
});