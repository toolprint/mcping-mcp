import { promptResources, getWelcomePrompt } from './prompts.js';
import { ResourceMetadata } from '../types/schemas.js';
import { getLogger } from '../../utils/logging.js';

export class ResourceProvider {
  private resources: ResourceMetadata[] = [];
  private logger = getLogger();

  constructor() {
    this.resources = [...promptResources];
    this.logger.debug(`Initialized ResourceProvider with ${this.resources.length} resources`);
  }

  listResources(): ResourceMetadata[] {
    return [...this.resources];
  }

  async getResource(uri: string): Promise<{ content: string; mimeType?: string } | null> {
    this.logger.debug(`Getting resource: ${uri}`);

    switch (uri) {
      case 'prompt://welcome':
        const content = await getWelcomePrompt();
        return {
          content,
          mimeType: 'text/plain',
        };
      default:
        this.logger.warn(`Resource not found: ${uri}`);
        return null;
    }
  }

  hasResource(uri: string): boolean {
    return this.resources.some((resource) => resource.uri === uri);
  }
}