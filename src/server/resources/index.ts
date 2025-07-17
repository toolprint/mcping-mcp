import { promptResources, getWelcomePrompt } from './prompts.js';
import { ResourceMetadata } from '../types/schemas.js';
import { logger } from '../../utils/logger.js';

export class ResourceProvider {
  private resources: ResourceMetadata[] = [];

  constructor() {
    this.resources = [...promptResources];
    logger.debug(`Initialized ResourceProvider with ${this.resources.length} resources`);
  }

  listResources(): ResourceMetadata[] {
    return [...this.resources];
  }

  async getResource(uri: string): Promise<{ content: string; mimeType?: string } | null> {
    logger.debug(`Getting resource: ${uri}`);

    switch (uri) {
      case 'prompt://welcome':
        const content = await getWelcomePrompt();
        return {
          content,
          mimeType: 'text/plain',
        };
      default:
        logger.warn(`Resource not found: ${uri}`);
        return null;
    }
  }

  hasResource(uri: string): boolean {
    return this.resources.some((resource) => resource.uri === uri);
  }
}