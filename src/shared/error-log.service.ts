import { Injectable } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ErrorLogService {
  private logFilePath: string;

  constructor() {
    // Set the path for the log file
    this.logFilePath = join(__dirname, '..', '..', 'error.log');

    // Ensure the directory exists
    const logDir = join(__dirname, '..', '..');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  logError(message: string, context?: string, stack?: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `
[${timestamp}]
${message}
Context: ${context || 'N/A'}
Stack: ${stack || 'N/A'}
--------------------------------------------
    `.trim(); // Trim whitespace for cleaner formatting

    try {
      if (process.env.NODE_ENV === 'production') {
        appendFileSync(this.logFilePath, logMessage + '\n'); // Append new line for separation
      } else {
        console.error(logMessage); // Log to console in non-production
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}
