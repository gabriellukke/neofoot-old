import { debug, info, warn, error, trace } from '@tauri-apps/plugin-log';

export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

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

  trace(message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatMessage(message, data);
    console.log(`🔍 ${formatted}`);
    trace(formatted);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatMessage(message, data);
    console.log(`🐛 ${formatted}`);
    debug(formatted);
  }

  info(message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatMessage(message, data);
    console.log(`ℹ️  ${formatted}`);
    info(formatted);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatMessage(message, data);
    console.warn(`⚠️  ${formatted}`);
    warn(formatted);
  }

  error(message: string, error?: Error | string | unknown, data?: Record<string, unknown>): void {
    const errorStr = error instanceof Error ? error.message : String(error);
    const formatted = this.formatMessage(`${message} | Error: ${errorStr}`, data);
    console.error(`❌ ${formatted}`);
    error(formatted);
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
