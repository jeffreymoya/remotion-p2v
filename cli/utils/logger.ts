export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: any;
}

class Logger {
  private minLevel: LogLevel = 'info';

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      meta,
    };

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}${metaStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}${metaStr}`);
        break;
      case 'info':
        console.info(`${prefix} ${message}${metaStr}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}${metaStr}`);
        break;
    }
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  progress(current: number, total: number, label: string): void {
    const percentage = Math.round((current / total) * 100);
    const bar = '='.repeat(Math.floor(percentage / 2)) + ' '.repeat(50 - Math.floor(percentage / 2));
    process.stdout.write(`\r[${bar}] ${percentage}% - ${label} (${current}/${total})`);
    if (current === total) {
      process.stdout.write('\n');
    }
  }
}

export const logger = new Logger();
