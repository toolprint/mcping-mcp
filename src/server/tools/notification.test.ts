import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleNotification, notificationTool } from './notification.js';
import { NotificationInput } from '../types/schemas.js';

// Mock node-notifier
vi.mock('node-notifier', () => ({
  default: {
    notify: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import notifier from 'node-notifier';

describe('Notification Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notificationTool', () => {
    it('should have correct tool definition', () => {
      expect(notificationTool.name).toBe('send-notification');
      expect(notificationTool.description).toBe('Send a desktop notification on macOS with subtitle and urgency support');
      expect(notificationTool.inputSchema).toBeDefined();
      expect(notificationTool.outputSchema).toBeDefined();
    });

    it('should have required fields in input schema', () => {
      const required = notificationTool.inputSchema.required;
      expect(required).toContain('title');
      expect(required).toContain('message');
    });

    it('should have correct output schema structure', () => {
      const properties = notificationTool.outputSchema.properties;
      expect(properties).toHaveProperty('success');
      expect(properties).toHaveProperty('timestamp');
      expect(properties).toHaveProperty('notificationId');
      expect(properties).toHaveProperty('error');
    });
  });

  describe('handleNotification', () => {
    const mockNotify = vi.mocked(notifier.notify);

    it('should send notification successfully with minimal input', async () => {
      mockNotify.mockImplementation((_options, callback) => {
        callback(null, 'notification sent');
      });

      const input: NotificationInput = {
        title: 'Test Title',
        message: 'Test Message',
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          message: 'Test Message',
          sound: true,
          timeout: 10,
          urgency: 'normal',
        }),
        expect.any(Function)
      );
    });

    it('should send notification with all optional fields including subtitle', async () => {
      mockNotify.mockImplementation((_options, callback) => {
        callback(null, 'notification sent');
      });

      const input: NotificationInput = {
        title: 'Test Title',
        message: 'Test Message',
        subtitle: 'Test Subtitle',
        sound: false,
        timeout: 30,
        urgency: 'critical',
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(true);
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          message: 'Test Message',
          subtitle: 'Test Subtitle',
          sound: false,
          timeout: 30,
          urgency: 'critical',
        }),
        expect.any(Function)
      );
    });

    it('should handle low urgency notifications', async () => {
      mockNotify.mockImplementation((_options, callback) => {
        callback(null, 'notification sent');
      });

      const input: NotificationInput = {
        title: 'Info Update',
        message: 'Background task completed',
        urgency: 'low',
        sound: false,
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(true);
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Info Update',
          message: 'Background task completed',
          urgency: 'low',
          sound: false,
        }),
        expect.any(Function)
      );
    });

    it('should handle notification errors with helpful messages', async () => {
      const error = new Error('Permission denied');
      mockNotify.mockImplementation((_options, callback) => {
        callback(error, '');
      });

      const input: NotificationInput = {
        title: 'Test Title',
        message: 'Test Message',
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Notification permission denied');
      expect(result.error).toContain('System Preferences');
      expect(result.timestamp).toBeDefined();
      expect(result.notificationId).toBeUndefined();
    });

    it('should handle system unavailable errors', async () => {
      const error = new Error('NotificationCenter is not available');
      mockNotify.mockImplementation((_options, callback) => {
        callback(error, '');
      });

      const input: NotificationInput = {
        title: 'Test Title',
        message: 'Test Message',
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('macOS Notification Center is not available');
      expect(result.error).toContain('running on macOS');
    });

    it('should handle rate limit errors', async () => {
      const error = new Error('too many notifications');
      mockNotify.mockImplementation((_options, callback) => {
        callback(error, '');
      });

      const input: NotificationInput = {
        title: 'Test Title',
        message: 'Test Message',
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many notifications sent recently');
      expect(result.error).toContain('wait a moment');
    });

    it('should handle timeout errors gracefully', async () => {
      const error = new Error('notification timeout');
      mockNotify.mockImplementation((_options, callback) => {
        callback(error, '');
      });

      const input: NotificationInput = {
        title: 'Test Title',
        message: 'Test Message',
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Notification timeout');
      expect(result.error).toContain('system may be busy');
    });

    it('should validate input and reject invalid data', async () => {
      const input = {
        title: '', // Invalid: empty title
        message: 'Test Message',
      } as NotificationInput;

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title is required and cannot be empty');
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should provide helpful message for long titles', async () => {
      const input: NotificationInput = {
        title: 'a'.repeat(101), // Too long
        message: 'Test Message',
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title must be 100 characters or less');
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should provide helpful message for long messages', async () => {
      const input: NotificationInput = {
        title: 'Test Title',
        message: 'a'.repeat(501), // Too long
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Message must be 500 characters or less');
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should validate input length constraints', async () => {
      const input = {
        title: 'a'.repeat(101), // Invalid: too long
        message: 'Test Message',
      } as NotificationInput;

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should handle timeout values correctly', async () => {
      mockNotify.mockImplementation((_options, callback) => {
        callback(null, 'notification sent');
      });

      const input: NotificationInput = {
        title: 'Test Title',
        message: 'Test Message',
        timeout: 5,
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(true);
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5,
        }),
        expect.any(Function)
      );
    });

    it('should provide helpful error for invalid urgency values', async () => {
      const input = {
        title: 'Test Title',
        message: 'Test Message',
        urgency: 'extreme', // Invalid urgency
      } as any;

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should provide helpful error for invalid timeout values', async () => {
      const input: NotificationInput = {
        title: 'Test Title',
        message: 'Test Message',
        timeout: 100, // Too high (max is 60)
      };

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });
});