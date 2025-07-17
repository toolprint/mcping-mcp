import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/logger.js';
import { APP_CONFIG } from '../../config/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getWelcomePrompt(): Promise<string> {
  try {
    const promptPath = join(__dirname, '../../resources/prompts/welcome.txt');
    const content = await readFile(promptPath, 'utf-8');
    logger.debug('Welcome prompt loaded successfully');
    return content;
  } catch (error) {
    logger.error('Failed to load welcome prompt:', error);
    return `Welcome to the ${APP_CONFIG.appName}!`;
  }
}

export const promptResources = [
  {
    uri: 'prompt://welcome',
    name: 'Welcome',
    description: 'Welcome message and usage instructions for the MCP server',
    mimeType: 'text/plain',
  },
];