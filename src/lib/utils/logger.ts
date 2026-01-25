// Lightweight logger used across services and tests.
// Replace with structured logging if/when a centralized logger is added.

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, ...args: unknown[]) {
  const prefix = `[${level.toUpperCase()}]`;
  switch (level) {
    case "debug":
      return console.debug(prefix, message, ...args);
    case "info":
      return console.info(prefix, message, ...args);
    case "warn":
      return console.warn(prefix, message, ...args);
    case "error":
      return console.error(prefix, message, ...args);
    default:
      return console.log(prefix, message, ...args);
  }
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => log("debug", message, ...args),
  info: (message: string, ...args: unknown[]) => log("info", message, ...args),
  warn: (message: string, ...args: unknown[]) => log("warn", message, ...args),
  error: (message: string, ...args: unknown[]) => log("error", message, ...args),
};
