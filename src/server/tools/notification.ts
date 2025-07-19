import { Tool } from '@modelcontextprotocol/sdk/types.js';
import notifier from 'node-notifier';
import { z } from 'zod';
import {
  NotificationInput,
  NotificationOutput,
  NotificationInputSchema,
  NotificationOutputSchema,
} from '../types/schemas.js';
import { getLogger } from '../../utils/logging.js';

const logger = getLogger();

export const notificationTool: Tool = {
  name: 'send-notification',
  description: 'Send a desktop notification on macOS with icon, image, and sound customization',
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
        oneOf: [
          {
            type: 'boolean',
            description: 'true for default sound, false for no sound',
          },
          {
            type: 'string',
            enum: ['Basso', 'Blow', 'Bottle', 'Frog', 'Funk', 'Glass', 'Hero', 'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink'],
            description: 'Built-in macOS sound name',
          },
          {
            type: 'string',
            pattern: '^/.*$',
            description: 'Absolute path to custom sound file',
          },
        ],
        description: 'Sound setting: boolean, built-in sound name, or path to custom sound',
        default: true,
      },
      timeout: {
        type: 'number',
        description: 'Notification timeout in seconds (1-60)',
        minimum: 1,
        maximum: 60,
        default: 10,
      },
      icon: {
        type: 'string',
        pattern: '^/.*$',
        description: 'Absolute path to notification icon image',
      },
      contentImage: {
        type: 'string',
        pattern: '^/.*$',
        description: 'Absolute path to image to attach to notification',
      },
      open: {
        type: 'string',
        format: 'uri',
        description: 'URL to open when notification is clicked',
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
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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
      wait: false, // Don't wait for user interaction
    };
    
    // Add optional fields if provided
    if (validatedInput.subtitle) {
      notificationOptions.subtitle = validatedInput.subtitle;
    }
    
    if (validatedInput.icon) {
      notificationOptions.icon = validatedInput.icon;
    }
    
    if (validatedInput.contentImage) {
      notificationOptions.contentImage = validatedInput.contentImage;
    }
    
    if (validatedInput.open) {
      notificationOptions.open = validatedInput.open;
    }

    // Send notification using node-notifier with timeout protection
    await Promise.race([
      new Promise<boolean>((resolve, reject) => {
        notifier.notify(notificationOptions, (error: Error | null, response: string) => {
          if (error) {
            logger.error('Failed to send notification:', error);
            reject(error);
          } else {
            logger.debug('Notification sent successfully:', response);
            resolve(true);
          }
        });
      }),
      // Timeout after 3 seconds - notification likely sent but callback didn't fire
      new Promise<boolean>((resolve) => {
        setTimeout(() => {
          logger.warn('Notification callback timeout - assuming success');
          resolve(true);
        }, 3000);
      })
    ]);

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
    
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      const firstError = error.errors[0];
      if (firstError) {
        const field = firstError.path.join('.');
        
        // Format validation errors in a user-friendly way
        if (firstError.code === 'too_small' && firstError.minimum === 1) {
          errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} is required and cannot be empty`;
        } else if (firstError.code === 'too_big') {
          // Replace field names in the message for better readability
          errorMessage = firstError.message.replace('String', 'Text');
        } else {
          errorMessage = firstError.message;
        }
      }
    } else if (error instanceof Error) {
      // Permission errors
      if (error.message.includes('Permission denied') || error.message.includes('authorization')) {
        errorMessage = 'Notification permission denied. Please allow notifications in System Preferences > Notifications > Terminal (or your app)';
      } 
      // Timeout errors
      else if (error.message.includes('timeout')) {
        errorMessage = 'Notification timeout - the notification system may be busy. Please try again';
      }
      // System unavailable
      else if (error.message.includes('not available') || error.message.includes('NotificationCenter')) {
        errorMessage = 'macOS Notification Center is not available. Please check that you are running on macOS';
      }
      // Rate limiting
      else if (error.message.includes('rate limit') || error.message.includes('too many')) {
        errorMessage = 'Too many notifications sent recently. Please wait a moment before sending more';
      }
      // Generic fallback
      else {
        errorMessage = `Notification error: ${error.message}`;
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