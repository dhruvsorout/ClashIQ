export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : "");
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : "");
  },
  error: (message: string, error?: unknown) => {
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, errorDetails ?? "");
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : "");
    }
  },
};
