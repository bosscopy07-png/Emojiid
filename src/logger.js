/**
 * Simple structured logger with configurable levels
 */

import { botConfig } from './config.js';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[botConfig.logLevel] ?? 1;

const timestamp = () => new Date().toISOString();

const shouldLog = (level) => LOG_LEVELS[level] >= currentLevel;

const formatLog = (level, message, meta = {}) => {
  return JSON.stringify({
    timestamp: timestamp(),
    level: level.toUpperCase(),
    message,
    ...meta,
  });
};

export const logger = {
  debug: (msg, meta) => shouldLog('debug') && console.debug(formatLog('debug', msg, meta)),
  info: (msg, meta) => shouldLog('info') && console.info(formatLog('info', msg, meta)),
  warn: (msg, meta) => shouldLog('warn') && console.warn(formatLog('warn', msg, meta)),
  error: (msg, meta) => shouldLog('error') && console.error(formatLog('error', msg, meta)),
};
