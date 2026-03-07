import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, json, errors, colorize, printf } = winston.format;

const LOG_DIR = process.env.LOG_DIR || '/app/logs';
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Human-readable format for console
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// JSON format for log files (Loki/Promtail compatible)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const defaultMeta = { service: 'nexa-backend' };

const transports = [
  new winston.transports.Console({ format: consoleFormat }),

  // All logs (info+) — 14 day retention
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'info',
  }),

  // Errors only — 30 day retention
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'error',
  }),

  // HTTP access logs — 14 day retention
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '50m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'http',
  }),
];

const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta,
  transports,
});

export default logger;
