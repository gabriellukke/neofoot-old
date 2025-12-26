import { debug, info, warn, error as logError, trace } from '@tauri-apps/plugin-log';

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${this.context}] ${message}${dataStr}`;
  }

  // Tauri log functions are async and non-blocking
  // No console.log to avoid sync overhead
  trace(message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatMessage(message, data);
    trace(formatted);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatMessage(message, data);
    debug(formatted);
  }

  info(message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatMessage(message, data);
    info(formatted);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatMessage(message, data);
    // Keep console.warn for development visibility
    console.warn(`⚠️  ${formatted}`);
    warn(formatted);
  }

  error(message: string, err?: Error | string | unknown, data?: Record<string, unknown>): void {
    const errorStr = err instanceof Error ? err.message : String(err);
    const formatted = this.formatMessage(`${message} | Error: ${errorStr}`, data);
    // Keep console.error for development visibility
    console.error(`❌ ${formatted}`);
    logError(formatted);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export const logger = {
  create: createLogger,
  page: (pageName: string) => createLogger(`Page:${pageName}`),
  component: (componentName: string) => createLogger(`Component:${componentName}`),
  service: (serviceName: string) => createLogger(`Service:${serviceName}`)
};
