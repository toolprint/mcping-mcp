import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Integration test to verify the notification functionality works end-to-end
 * This test actually starts the MCP server and sends real JSON-RPC requests
 */

describe('Notification Functionality Integration Test', () => {
  let serverProcess: ChildProcess;
  let requestId = 1;
  
  // Helper function to send JSON-RPC requests
  const sendRequest = (method: string, params: any = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: requestId++,
        method: method,
        params: params
      };
      
      console.log('→ Sending:', JSON.stringify(request));
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);
      
      const responseHandler = (data: Buffer) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            console.log('← Received:', JSON.stringify(response, null, 2));
            
            if (response.id === request.id) {
              clearTimeout(timeout);
              serverProcess.stdout?.off('data', responseHandler);
              
              if (response.error) {
                reject(new Error(`JSON-RPC Error: ${response.error.message}`));
              } else {
                resolve(response.result);
              }
              return;
            }
          } catch (e) {
            // Ignore non-JSON lines (like logs)
          }
        }
      };
      
      serverProcess.stdout?.on('data', responseHandler);
      serverProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  };
  
  beforeAll(async () => {
    // Start the MCP server with stdio transport
    serverProcess = spawn('node', ['dist/index.js', '--transport', 'stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    // Handle server errors
    serverProcess.stderr?.on('data', (data) => {
      console.error('Server stderr:', data.toString());
    });
    
    // Handle server exit
    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
    
    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Initialize the MCP connection
    console.log('Initializing MCP connection...');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
  }, 10000);
  
  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      
      // Wait for process to close
      await new Promise<void>((resolve) => {
        serverProcess.on('close', () => resolve());
        setTimeout(() => {
          serverProcess.kill('SIGKILL');
          resolve();
        }, 2000);
      });
    }
  });
  
  it('should list the send-notification tool', async () => {
    const result = await sendRequest('tools/list');
    
    expect(result).toBeDefined();
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe('send-notification');
    expect(result.tools[0].description).toBe('Send a desktop notification on macOS with subtitle and urgency support');
    expect(result.tools[0].inputSchema).toBeDefined();
    expect(result.tools[0].inputSchema.required).toContain('title');
    expect(result.tools[0].inputSchema.required).toContain('message');
  });
  
  it('should send a basic notification successfully', async () => {
    const result = await sendRequest('tools/call', {
      name: 'send-notification',
      arguments: {
        title: 'Integration Test',
        message: 'This is a basic test notification'
      }
    });
    
    expect(result).toBeDefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    
    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.notificationId).toBeDefined();
    expect(response.timestamp).toBeDefined();
    
    console.log('✅ Basic notification sent successfully');
  });
  
  it('should send a notification with subtitle and critical urgency', async () => {
    const result = await sendRequest('tools/call', {
      name: 'send-notification',
      arguments: {
        title: 'Critical Alert',
        message: 'This is a critical test notification',
        subtitle: 'Integration Test Suite',
        urgency: 'critical',
        sound: true,
        timeout: 10
      }
    });
    
    expect(result).toBeDefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    
    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.notificationId).toBeDefined();
    expect(response.timestamp).toBeDefined();
    
    console.log('✅ Critical notification with subtitle sent successfully');
  });
  
  it('should send a low urgency notification without sound', async () => {
    const result = await sendRequest('tools/call', {
      name: 'send-notification',
      arguments: {
        title: 'Info Update',
        message: 'This is a low priority notification',
        urgency: 'low',
        sound: false,
        timeout: 5
      }
    });
    
    expect(result).toBeDefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    
    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.notificationId).toBeDefined();
    expect(response.timestamp).toBeDefined();
    
    console.log('✅ Low urgency notification sent successfully');
  });
  
  it('should handle invalid notification arguments', async () => {
    const result = await sendRequest('tools/call', {
      name: 'send-notification',
      arguments: {
        title: '', // Invalid: empty title
        message: 'Test message'
      }
    });
    
    expect(result).toBeDefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    
    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error).toContain('Title cannot be empty');
    
    console.log('✅ Invalid arguments properly rejected');
  });
  
  it('should handle non-existent tool calls', async () => {
    await expect(
      sendRequest('tools/call', {
        name: 'non-existent-tool',
        arguments: {}
      })
    ).rejects.toThrow();
    
    console.log('✅ Non-existent tool properly rejected');
  });
  
  it('should test all urgency levels', async () => {
    const urgencyLevels = ['low', 'normal', 'critical'] as const;
    
    for (const urgency of urgencyLevels) {
      const result = await sendRequest('tools/call', {
        name: 'send-notification',
        arguments: {
          title: `${urgency.toUpperCase()} Urgency Test`,
          message: `Testing ${urgency} urgency level`,
          subtitle: 'Urgency Test Suite',
          urgency: urgency,
          sound: urgency === 'critical',
          timeout: urgency === 'critical' ? 15 : 5
        }
      });
      
      expect(result).toBeDefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.notificationId).toBeDefined();
      
      console.log(`✅ ${urgency} urgency notification sent successfully`);
      
      // Add a small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });
});