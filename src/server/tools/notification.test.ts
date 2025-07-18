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

    it('should validate input and reject invalid data', async () => {
      const input = {
        title: '', // Invalid: empty title
        message: 'Test Message',
      } as NotificationInput;

      const result = await handleNotification(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
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
  });
});