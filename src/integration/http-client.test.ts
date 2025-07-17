import { describe, beforeAll, afterAll, test, expect } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { APP_CONFIG } from '../config/app.js';

// Simple HTTP client for testing MCP protocol
class McpHttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async sendRequest(method: string, params: any = {}, id: number = 1) {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    });

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      // Handle streaming response
      const text = await response.text();
      return { streamingResponse: text };
    }
  }

  async initialize() {
    return this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: {
          listChanged: true,
        },
        sampling: {},
      },
      clientInfo: {
        name: 'http-test-client',
        version: '1.0.0',
      },
    });
  }

  async listTools() {
    return this.sendRequest('tools/list');
  }

  async callTool(name: string, args: any = {}) {
    return this.sendRequest('tools/call', {
      name,
      arguments: args,
    });
  }

  async listResources() {
    return this.sendRequest('resources/list');
  }

  async readResource(uri: string) {
    return this.sendRequest('resources/read', { uri });
  }
}

describe('HTTP MCP Client Integration Tests', () => {
  let serverProcess: ChildProcess;
  let client: McpHttpClient;
  const port = 3005;

  beforeAll(async () => {
    // Start the MCP server process with HTTP transport
    const serverPath = join(process.cwd(), 'dist/index.js');
    serverProcess = spawn('node', [
      serverPath,
      '--transport',
      'http',
      '--port',
      port.toString(),
      '--verbose',
    ], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Wait for server to start and check health
    let serverReady = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!serverReady && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
      
      try {
        const healthResponse = await fetch(`http://localhost:${port}/health`);
        if (healthResponse.ok) {
          serverReady = true;
          console.log('HTTP MCP server started successfully');
        }
      } catch (error) {
        console.log(`Attempt ${attempts}/${maxAttempts}: Server not ready yet...`);
      }
    }

    if (!serverReady) {
      throw new Error(`Server failed to start after ${maxAttempts} attempts`);
    }

    client = new McpHttpClient(`http://localhost:${port}`);
  }, 20000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      // Wait for process to die
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });

  describe('MCP Protocol Tests', () => {
    test('should handle initialize request', async () => {
      const result = await client.initialize();

      expect(result).toBeDefined();
      expect(result.jsonrpc).toBe('2.0');
      
      if (result.error) {
        console.error('Initialize error:', result.error);
        throw new Error(`Initialize failed: ${result.error.message}`);
      }

      expect(result.result).toBeDefined();
      expect(result.result.protocolVersion).toBeDefined();
      expect(result.result.serverInfo).toBeDefined();
      expect(result.result.serverInfo.name).toBe(APP_CONFIG.technicalName);

      console.log('Initialize successful:', result.result);
    });

    test('should list available tools', async () => {
      const result = await client.listTools();

      expect(result).toBeDefined();
      expect(result.jsonrpc).toBe('2.0');

      if (result.error) {
        console.error('List tools error:', result.error);
        throw new Error(`List tools failed: ${result.error.message}`);
      }

      expect(result.result).toBeDefined();
      expect(result.result.tools).toHaveLength(3);

      const toolNames = result.result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('hello-world');
      expect(toolNames).toContain('echo');
      expect(toolNames).toContain('health');

      console.log('Available tools:', result.result.tools);
    });

    test('should call hello-world tool', async () => {
      const result = await client.callTool('hello-world');

      expect(result).toBeDefined();
      expect(result.jsonrpc).toBe('2.0');

      if (result.error) {
        console.error('Call tool error:', result.error);
        throw new Error(`Call tool failed: ${result.error.message}`);
      }

      expect(result.result).toBeDefined();
      expect(result.result.content).toHaveLength(1);
      expect(result.result.content[0].type).toBe('text');

      const responseText = result.result.content[0].text;
      const toolResponse = JSON.parse(responseText);
      expect(toolResponse.message).toBe(`Hello from ${APP_CONFIG.appName}!`);

      console.log('Hello-world tool response:', toolResponse);
    });

    test('should call echo tool with text', async () => {
      const testText = 'HTTP client test message';
      const result = await client.callTool('echo', { text: testText });

      expect(result).toBeDefined();
      expect(result.jsonrpc).toBe('2.0');

      if (result.error) {
        console.error('Call echo tool error:', result.error);
        throw new Error(`Call echo tool failed: ${result.error.message}`);
      }

      expect(result.result).toBeDefined();
      expect(result.result.content).toHaveLength(1);

      const responseText = result.result.content[0].text;
      const toolResponse = JSON.parse(responseText);
      expect(toolResponse.echo).toBe(testText);

      console.log('Echo tool response:', toolResponse);
    });

    test('should call health tool', async () => {
      const result = await client.callTool('health');

      expect(result).toBeDefined();
      expect(result.jsonrpc).toBe('2.0');

      if (result.error) {
        console.error('Call health tool error:', result.error);
        throw new Error(`Call health tool failed: ${result.error.message}`);
      }

      expect(result.result).toBeDefined();
      expect(result.result.content).toHaveLength(1);

      const responseText = result.result.content[0].text;
      const toolResponse = JSON.parse(responseText);
      expect(toolResponse.status).toBe('green');

      console.log('Health tool response:', toolResponse);
    });

    test('should list and read resources', async () => {
      // List resources
      const listResult = await client.listResources();

      expect(listResult).toBeDefined();
      expect(listResult.result).toBeDefined();
      expect(listResult.result.resources).toHaveLength(1);

      const resource = listResult.result.resources[0];
      expect(resource.uri).toBe('prompt://welcome');
      expect(resource.name).toBe('Welcome');

      // Read resource
      const readResult = await client.readResource('prompt://welcome');

      expect(readResult).toBeDefined();
      expect(readResult.result).toBeDefined();
      expect(readResult.result.contents).toHaveLength(1);

      const content = readResult.result.contents[0];
      expect(content.uri).toBe('prompt://welcome');
      expect(content.mimeType).toBe('text/plain');
      expect(content.text).toContain('Welcome to the MCP TypeScript Server Template!');

      console.log('Resource content:', content.text);
    });

    test('should handle invalid tool name', async () => {
      const result = await client.callTool('nonexistent-tool');

      expect(result).toBeDefined();
      expect(result.jsonrpc).toBe('2.0');
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Unknown tool');

      console.log('Expected error for invalid tool:', result.error);
    });

    test('should handle invalid echo tool input', async () => {
      const result = await client.callTool('echo', { text: '' });

      expect(result).toBeDefined();
      expect(result.jsonrpc).toBe('2.0');
      expect(result.error).toBeDefined();

      console.log('Expected error for invalid input:', result.error);
    });
  });

  describe('Complete Workflow Test', () => {
    test('should execute a complete MCP workflow', async () => {
      // 1. Initialize
      const initResult = await client.initialize();
      expect(initResult.result).toBeDefined();

      // 2. List tools
      const toolsResult = await client.listTools();
      expect(toolsResult.result.tools).toHaveLength(3);

      // 3. List resources
      const resourcesResult = await client.listResources();
      expect(resourcesResult.result.resources).toHaveLength(1);

      // 4. Read welcome resource
      const welcomeResult = await client.readResource('prompt://welcome');
      expect(welcomeResult.result.contents[0].text).toContain('Welcome');

      // 5. Check health
      const healthResult = await client.callTool('health');
      const healthResponse = JSON.parse(healthResult.result.content[0].text);
      expect(healthResponse.status).toBe('green');

      // 6. Echo test
      const message = `Workflow test at ${new Date().toISOString()}`;
      const echoResult = await client.callTool('echo', { text: message });
      const echoResponse = JSON.parse(echoResult.result.content[0].text);
      expect(echoResponse.echo).toBe(message);

      // 7. Hello world
      const helloResult = await client.callTool('hello-world');
      const helloResponse = JSON.parse(helloResult.result.content[0].text);
      expect(helloResponse.message).toBe(`Hello from ${APP_CONFIG.appName}!`);

      console.log('Complete workflow test passed successfully!');
    });
  });
});