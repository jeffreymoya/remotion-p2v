import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
  base: {
    env: process.env.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Child logger factory for specific contexts
export const createLogger = (context: Record<string, unknown>) =>
  logger.child(context);

// Pre-configured child loggers for common domains
export const aiLogger = createLogger({ domain: "ai" });
export const ttsLogger = createLogger({ domain: "tts" });
export const assetsLogger = createLogger({ domain: "assets" });
export const renderLogger = createLogger({ domain: "render" });
export const boardsLogger = createLogger({ domain: "boards" });
