import { ServerConfig, ServerConfigSchema } from '../server/types/schemas.js';

export class ConfigManager {
  private config: ServerConfig;

  constructor(initialConfig: Partial<ServerConfig> = {}) {
    this.config = ServerConfigSchema.parse({
      transport: 'stdio',
      port: 3000,
      host: 'localhost',
      ...initialConfig,
    });
  }

  getConfig(): ServerConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ServerConfig>): void {
    this.config = ServerConfigSchema.parse({
      ...this.config,
      ...updates,
    });
  }

  getTransport(): 'stdio' | 'http' {
    return this.config.transport;
  }

  getPort(): number {
    return this.config.port;
  }

  getHost(): string {
    return this.config.host;
  }
}