import pino from 'pino';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { APP_TECHNICAL_NAME } from '../config/app.js';

export interface LoggingConfig {
  level: pino.LevelWithSilent;
  enableConsole: boolean;
  enableFile: boolean;
  serverName: string;
  format: 'json' | 'pretty';
  colorize: boolean;
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsole: true,
  enableFile: true,
  serverName: APP_TECHNICAL_NAME,
  format: 'pretty', // Always use pretty format for console
  colorize: true,
};

export const STDIO_LOGGING_CONFIG: LoggingConfig = {
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsole: false,
  enableFile: true,
  serverName: APP_TECHNICAL_NAME,
  format: 'pretty', // Always use pretty format for console
  colorize: true,
};

export class Logger {
  private pinoLogger: pino.Logger;
  private config: LoggingConfig;

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = { ...DEFAULT_LOGGING_CONFIG, ...config };
    this.pinoLogger = this.createLogger();
  }

  private createLogger(): pino.Logger {
    const streams: pino.StreamEntry[] = [];

    // Console stream
    if (this.config.enableConsole) {
      streams.push({
        level: this.config.level as pino.Level,
        stream: this.createConsoleStream(),
      });
    }

    // File stream
    if (this.config.enableFile) {
      const fileStream = this.createFileStream();
      if (fileStream) {
        streams.push({
          level: this.config.level as pino.Level,
          stream: fileStream,
        });
      }
    }

    // If no streams, fallback to console
    if (streams.length === 0) {
      streams.push({
        level: this.config.level as pino.Level,
        stream: process.stdout,
      });
    }

    return pino(
      {
        level: this.config.level,
        base: {
          pid: process.pid,
          hostname: process.env.HOSTNAME || 'localhost',
          serverName: this.config.serverName,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      pino.multistream(streams)
    );
  }

  private createConsoleStream() {
    // Always use pino-pretty for console output for better readability
    return pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: this.config.colorize,
        translateTime: 'SYS:standard',
        include: 'level,time,msg',
        ignore: 'pid,hostname', // Simplify output
      },
    });
  }


  private createFileStream() {
    try {
      const logDir = join(homedir(), '.toolprint', this.config.serverName);

      // Create directory synchronously on first use
      this.ensureLogDirectory(logDir);

      const logFile = join(logDir, `${this.config.serverName}.log`);
      return createWriteStream(logFile, { flags: 'a' });
    } catch (error) {
      console.warn('Failed to create log file stream:', error);
      return null;
    }
  }

  private ensureLogDirectory(logDir: string): void {
    try {
      mkdirSync(logDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create log directory:', error);
    }
  }

  // Public logging methods
  fatal(message: string, context?: any): void {
    this.pinoLogger.fatal(context, message);
  }

  error(message: string, context?: any): void {
    this.pinoLogger.error(context, message);
  }

  warn(message: string, context?: any): void {
    this.pinoLogger.warn(context, message);
  }

  info(message: string, context?: any): void {
    this.pinoLogger.info(context, message);
  }

  debug(message: string, context?: any): void {
    this.pinoLogger.debug(context, message);
  }

  trace(message: string, context?: any): void {
    this.pinoLogger.trace(context, message);
  }

  // Structured logging methods
  child(bindings: pino.Bindings): Logger {
    const childLogger = new Logger(this.config);
    childLogger.pinoLogger = this.pinoLogger.child(bindings);
    return childLogger;
  }

  // Access to underlying pino logger for advanced use cases
  get pino(): pino.Logger {
    return this.pinoLogger;
  }

  // Update configuration
  updateConfig(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
    this.pinoLogger = this.createLogger();
  }
}

// Global logger instance
let logger: Logger;

// Convenience function to create a child logger
export function createLogger(context: pino.Bindings, config?: Partial<LoggingConfig>): Logger {
  if (config) {
    return new Logger(config).child(context);
  }
  return logger.child(context);
}

export function getLogger(config?: Partial<LoggingConfig>): Logger {
  if (config) {
    return new Logger(config);
  }
  if (!logger) {
    logger = new Logger();
  }
  return logger;
}
