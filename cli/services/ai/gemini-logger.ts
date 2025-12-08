import { promises as fs } from 'fs';
import path from 'path';

export interface GeminiLogEntry {
  timestamp: string;
  pipelineStage: string;
  prompt: string;
  response: string;
  model: string;
  temperature: number;
  maxTokens: number;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export class GeminiLogger {
  private static instance: GeminiLogger;
  private logDir: string;
  private readonly timeZone = 'Asia/Manila';

  private constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'gemini');
  }

  public static getInstance(): GeminiLogger {
    if (!GeminiLogger.instance) {
      GeminiLogger.instance = new GeminiLogger();
    }
    return GeminiLogger.instance;
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private getLogFileName(): string {
    const parts = this.getPhilippinesDateParts();
    return `${parts.year}-${parts.month}-${parts.day}.jsonl`;
  }

  private sanitizePrompt(prompt: string): string {
    // Remove multimodal image paths for cleaner logs
    // Converts "@/path/to/image.png\n\nActual prompt" to "Actual prompt [with image: /path/to/image.png]"
    const imageMatch = prompt.match(/^@(.+?)\n\n(.+)$/s);
    if (imageMatch) {
      return `${imageMatch[2]} [with image: ${imageMatch[1]}]`;
    }
    return prompt;
  }

  public async log(entry: Omit<GeminiLogEntry, 'timestamp'>): Promise<void> {
    await this.ensureLogDirectory();

    const logEntry: GeminiLogEntry = {
      timestamp: this.getPhilippinesTimestamp(),
      ...entry,
      prompt: this.sanitizePrompt(entry.prompt),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = path.join(this.logDir, this.getLogFileName());

    try {
      await fs.appendFile(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  public async logRequest(
    pipelineStage: string,
    prompt: string,
    config: {
      model: string;
      temperature: number;
      maxTokens: number;
    },
    metadata?: Record<string, any>
  ): Promise<{ logId: string; startTime: number }> {
    const logId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Log the request immediately
    await this.log({
      pipelineStage,
      prompt,
      response: '[PENDING]',
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      metadata: {
        ...metadata,
        logId,
        status: 'request_sent',
      },
    });

    return { logId, startTime };
  }

  public async logResponse(
    pipelineStage: string,
    prompt: string,
    response: string,
    config: {
      model: string;
      temperature: number;
      maxTokens: number;
    },
    startTime: number,
    logId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const duration = Date.now() - startTime;

    await this.log({
      pipelineStage,
      prompt,
      response,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      duration,
      metadata: {
        ...metadata,
        logId,
        status: 'completed',
      },
    });
  }

  public async logError(
    pipelineStage: string,
    prompt: string,
    error: string,
    config: {
      model: string;
      temperature: number;
      maxTokens: number;
    },
    startTime: number,
    logId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const duration = Date.now() - startTime;

    await this.log({
      pipelineStage,
      prompt,
      response: '[ERROR]',
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      duration,
      error,
      metadata: {
        ...metadata,
        logId,
        status: 'error',
      },
    });
  }

  public async getLogsForDate(date: Date): Promise<GeminiLogEntry[]> {
    const parts = this.getPhilippinesDateParts(date);
    const fileName = `${parts.year}-${parts.month}-${parts.day}.jsonl`;
    const filePath = path.join(this.logDir, fileName);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  public async getLogsByPipelineStage(
    stage: string,
    date?: Date
  ): Promise<GeminiLogEntry[]> {
    const logsDate = date || new Date();
    const allLogs = await this.getLogsForDate(logsDate);
    return allLogs.filter((log) => log.pipelineStage === stage);
  }

  private getPhilippinesDateParts(date: Date = new Date()): Record<string, string> {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    const mapped: Record<string, string> = {};

    for (const part of parts) {
      if (part.type !== 'literal') {
        mapped[part.type] = part.value;
      }
    }

    // Fallback to zeroed fractional seconds if formatter omits it
    if (!mapped.fractionalSecond) {
      mapped.fractionalSecond = '000';
    }

    return mapped;
  }

  private getPhilippinesTimestamp(date: Date = new Date()): string {
    const parts = this.getPhilippinesDateParts(date);
    const fractionalSeconds = parts.fractionalSecond.padEnd(3, '0').slice(0, 3);

    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${fractionalSeconds}+08:00`;
  }
}
