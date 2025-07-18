import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleNotification } from './notification.js';
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
  },
}));

describe('notification tool', () => {
  let mockNotifier: any;
  
  beforeEach(async () => {
    mockNotifier = await import('node-notifier');
    vi.clearAllMocks();
  });

  it('should send basic notification successfully', async () => {
    const mockNotify = vi.mocked(mockNotifier.default.notify);
    mockNotify.mockImplementation((options, callback) => {
      callback(null, 'success', { id: 'test-id' });
    });

    const input: NotificationInput = {
      title: 'Test Title',
      message: 'Test Message',
      urgency: 'normal',
      sound: true,
      timeout: 5,
    };

    const result = await handleNotification(input);

    expect(result.success).toBe(true);
    expect(result.message).toContain('normal urgency');
    expect(result.notificationId).toBe('test-id');
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Title',
        message: 'Test Message',
        urgency: 'normal',
        sound: true,
        timeout: 5,
      }),
      expect.any(Function)
    );
  });

  it('should send notification with subtitle and critical urgency', async () => {
    const mockNotify = vi.mocked(mockNotifier.default.notify);
    mockNotify.mockImplementation((options, callback) => {
      callback(null, 'success', { id: 'test-id-2' });
    });

    const input: NotificationInput = {
      title: 'Critical Alert',
      message: 'System failure detected',
      subtitle: 'Immediate attention required',
      urgency: 'critical',
      sound: true,
      timeout: 10,
    };

    const result = await handleNotification(input);

    expect(result.success).toBe(true);
    expect(result.message).toContain('critical urgency');
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Critical Alert',
        message: 'System failure detected',
        subtitle: 'Immediate attention required',
        urgency: 'critical',
        sound: true,
        timeout: 10,
      }),
      expect.any(Function)
    );
  });

  it('should handle low urgency notification without sound', async () => {
    const mockNotify = vi.mocked(mockNotifier.default.notify);
    mockNotify.mockImplementation((options, callback) => {
      callback(null, 'success', { id: 'test-id-3' });
    });

    const input: NotificationInput = {
      title: 'Info Update',
      message: 'Background task completed',
      urgency: 'low',
      sound: false,
      timeout: 3,
    };

    const result = await handleNotification(input);

    expect(result.success).toBe(true);
    expect(result.message).toContain('low urgency');
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Info Update',
        message: 'Background task completed',
        urgency: 'low',
        sound: false,
        timeout: 3,
      }),
      expect.any(Function)
    );
  });

  it('should handle notification errors gracefully', async () => {
    const mockNotify = vi.mocked(mockNotifier.default.notify);
    mockNotify.mockImplementation((options, callback) => {
      callback(new Error('Permission denied'), null, null);
    });

    const input: NotificationInput = {
      title: 'Test',
      message: 'Test message',
      urgency: 'normal',
      sound: true,
      timeout: 5,
    };

    const result = await handleNotification(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Notification permission denied');
    expect(result.message).toContain('System Preferences');
  });

  it('should validate input schema', async () => {
    const mockNotify = vi.mocked(mockNotifier.default.notify);

    const invalidInput = {
      title: '', // Empty title should fail validation
      message: 'Test message',
    } as NotificationInput;

    const result = await handleNotification(invalidInput);

    expect(result.success).toBe(false);
    expect(result.message).toContain('error');
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('should use default values for optional fields', async () => {
    const mockNotify = vi.mocked(mockNotifier.default.notify);
    mockNotify.mockImplementation((options, callback) => {
      callback(null, 'success', { id: 'test-id-4' });
    });

    const input: NotificationInput = {
      title: 'Simple Test',
      message: 'Simple message',
      urgency: 'normal',
      sound: true,
      timeout: 5,
    };

    const result = await handleNotification(input);

    expect(result.success).toBe(true);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Simple Test',
        message: 'Simple message',
        urgency: 'normal',
        sound: true,
        timeout: 5,
      }),
      expect.any(Function)
    );
    
    // Should not include subtitle if not provided
    expect(mockNotify.mock.calls[0][0]).not.toHaveProperty('subtitle');
  });
});