import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  NotificationInput,
  NotificationOutput,
  NotificationInputSchema,
  NotificationOutputSchema,
} from '../types/schemas.js';
import { logger } from '../../utils/logger.js';
import notifier from 'node-notifier';

export const notificationTool: Tool = {
  name: 'send-notification',
  description: 'Sends a desktop notification on macOS',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The notification title',
        minLength: 1,
        maxLength: 100,
      },
      message: {
        type: 'string',
        description: 'The notification message body',
        minLength: 1,
        maxLength: 500,
      },
      subtitle: {
        type: 'string',
        description: 'Optional subtitle for the notification',
        maxLength: 100,
      },
      sound: {
        type: 'boolean',
        description: 'Whether to play notification sound',
        default: true,
      },
      timeout: {
        type: 'number',
        description: 'Auto-dismiss timeout in seconds (1-60)',
        minimum: 1,
        maximum: 60,
        default: 10,
      },
      urgency: {
        type: 'string',
        description: 'Notification urgency level',
        enum: ['low', 'normal', 'critical'],
        default: 'normal',
      },
    },
    required: ['title', 'message'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the notification was sent successfully',
      },
      notificationId: {
        type: 'string',
        description: 'Unique identifier for the notification',
      },
      error: {
        type: 'string',
        description: 'Error message if the notification failed',
      },
      timestamp: {
        type: 'number',
        description: 'Unix timestamp when the notification was sent',
      },
    },
    required: ['success', 'timestamp'],
  },
};

export async function handleNotification(input: NotificationInput): Promise<NotificationOutput> {
  logger.debug('Executing notification tool with input:', input);

  try {
    // Validate input
    const validatedInput = NotificationInputSchema.parse(input);
    
    // Generate unique notification ID
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    // Prepare notification options
    const notificationOptions = {
      title: validatedInput.title,
      message: validatedInput.message,
      subtitle: validatedInput.subtitle,
      sound: validatedInput.sound,
      timeout: validatedInput.timeout,
      // Map urgency to macOS notification center urgency
      urgency: validatedInput.urgency === 'critical' ? 'critical' : 'normal',
    };

    // Send notification using node-notifier
    const result = await new Promise<boolean>((resolve, reject) => {
      notifier.notify(notificationOptions, (error: Error | null, response: string) => {
        if (error) {
          logger.error('Failed to send notification:', error);
          reject(error);
        } else {
          logger.debug('Notification sent successfully:', response);
          resolve(true);
        }
      });
    });

    const output: NotificationOutput = {
      success: true,
      notificationId,
      timestamp,
    };

    // Validate output
    NotificationOutputSchema.parse(output);

    logger.info('Notification tool executed successfully', {
      notificationId,
      title: validatedInput.title,
      urgency: validatedInput.urgency,
    });

    return output;
  } catch (error) {
    logger.error('Error executing notification tool:', error);

    const output: NotificationOutput = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now(),
    };

    // Validate output even in error case
    NotificationOutputSchema.parse(output);

    return output;
  }
}