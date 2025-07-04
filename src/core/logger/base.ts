interface Logger {
  info(message: string, data?: unknown): void;
  error(message: string, error?: unknown): void;
  warn(message: string, data?: unknown): void;
  debug(message: string, data?: unknown): void;
}

class SimpleLogger implements Logger {
  info(message: string, data?: unknown): void {
    console.log(`[INFO] ${message}`, data ? data : '');
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error ? error : '');
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data ? data : '');
  }

  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data ? data : '');
    }
  }
}

const logger = new SimpleLogger();
export default logger;
