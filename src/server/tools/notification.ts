import { Tool } from '@modelcontextprotocol/sdk/types.js';
import notifier from 'node-notifier';
import {
  NotificationInput,
  NotificationOutput,
  NotificationInputSchema,
  NotificationOutputSchema,
} from '../types/schemas.js';
import { logger } from '../../utils/logger.js';

export const notificationTool: Tool = {
  name: 'send-notification',
  description: 'Send a desktop notification on macOS with subtitle and urgency support',
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
        description: 'Optional subtitle text displayed below the title',
        maxLength: 100,
      },
      urgency: {
        type: 'string',
        enum: ['low', 'normal', 'critical'],
        description: 'Notification urgency level',
        default: 'normal',
      },
      sound: {
        type: 'boolean',
        description: 'Whether to play a sound with the notification',
        default: true,
      },
      timeout: {
        type: 'number',
        description: 'Notification timeout in seconds (1-60)',
        minimum: 1,
        maximum: 60,
        default: 10,
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

    // Map urgency to macOS notification priority (enhanced mapping)
    const urgencyMap = {
      low: 'low',
      normal: 'normal', 
      critical: 'critical',
    };
    
    // Prepare notification options
    const notificationOptions: any = {
      title: validatedInput.title,
      message: validatedInput.message,
      sound: validatedInput.sound,
      timeout: validatedInput.timeout,
      urgency: urgencyMap[validatedInput.urgency],
    };
    
    // Add subtitle if provided
    if (validatedInput.subtitle) {
      notificationOptions.subtitle = validatedInput.subtitle;
    }

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

    // Handle common errors with helpful messages
    let errorMessage = 'Failed to send notification';
    
    if (error instanceof Error) {
      if (error.message.includes('Permission denied')) {
        errorMessage = 'Notification permission denied. Please allow notifications in System Preferences > Notifications';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Notification timeout - please check your notification settings';
      } else {
        errorMessage = error.message;
      }
    }

    const output: NotificationOutput = {
      success: false,
      error: errorMessage,
      timestamp: Date.now(),
    };

    // Validate output even in error case
    NotificationOutputSchema.parse(output);

    return output;
  }
}