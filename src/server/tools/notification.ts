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
      },
      message: {
        type: 'string',
        description: 'The notification message body',
        minLength: 1,
      },
      subtitle: {
        type: 'string',
        description: 'Optional subtitle text displayed below the title',
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
        description: 'Notification timeout in seconds (0-60)',
        minimum: 0,
        maximum: 60,
        default: 5,
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
      message: {
        type: 'string',
        description: 'Status message about the notification',
      },
      notificationId: {
        type: 'string',
        description: 'Optional identifier for the notification',
      },
    },
    required: ['success', 'message'],
  },
};

export async function handleNotification(input: NotificationInput): Promise<NotificationOutput> {
  logger.debug('Executing notification tool with input:', input);
  
  try {
    // Validate input
    const validatedInput = NotificationInputSchema.parse(input);
    
    // Map urgency to macOS notification priority
    const urgencyMap = {
      low: 'low',
      normal: 'normal', 
      critical: 'critical',
    };
    
    // Configure notification options
    const notificationOptions: any = {
      title: validatedInput.title,
      message: validatedInput.message,
      sound: validatedInput.sound,
      timeout: validatedInput.timeout,
    };
    
    // Add subtitle if provided
    if (validatedInput.subtitle) {
      notificationOptions.subtitle = validatedInput.subtitle;
    }
    
    // Set urgency level (maps to macOS priority)
    notificationOptions.urgency = urgencyMap[validatedInput.urgency];
    
    // Send notification
    const result = await new Promise<any>((resolve, reject) => {
      notifier.notify(notificationOptions, (error, response, metadata) => {
        if (error) {
          reject(error);
        } else {
          resolve({ response, metadata });
        }
      });
    });
    
    const output: NotificationOutput = {
      success: true,
      message: `Notification sent successfully with ${validatedInput.urgency} urgency`,
      notificationId: result.metadata?.id || undefined,
    };
    
    // Validate output
    NotificationOutputSchema.parse(output);
    
    logger.debug('Notification tool executed successfully');
    return output;
    
  } catch (error) {
    logger.error('Error sending notification:', error);
    
    // Handle common errors with helpful messages
    let errorMessage = 'Failed to send notification';
    
    if (error instanceof Error) {
      if (error.message.includes('Permission denied')) {
        errorMessage = 'Notification permission denied. Please allow notifications in System Preferences > Notifications';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Notification timeout - please check your notification settings';
      } else {
        errorMessage = `Notification error: ${error.message}`;
      }
    }
    
    const output: NotificationOutput = {
      success: false,
      message: errorMessage,
    };
    
    // Validate output
    NotificationOutputSchema.parse(output);
    
    return output;
  }
}