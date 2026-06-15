/**
 * Configuration module
 * Loads environment variables with sensible defaults
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
config({ path: join(__dirname, '..', '.env') });

/**
 * @typedef {Object} BotConfig
 * @property {string} token - Telegram bot token
 * @property {string} logLevel - Logging level
 * @property {number} maxMessageLength - Telegram max message length (4096 chars)
 * @property {number} maxEmojisPerBatch - Max emojis to process in one message
 */

/** @type {BotConfig} */
export const botConfig = {
  token: process.env.BOT_TOKEN,
  logLevel: process.env.LOG_LEVEL || 'info',
  maxMessageLength: 4096,           // Telegram message character limit
  maxEmojisPerBatch: 1000,         // Safety limit for emoji processing
  chunkSize: 100,                  // Emojis per response chunk
};

// Validate required configuration
if (!botConfig.token) {
  console.error('❌ ERROR: BOT_TOKEN is required. Set it in your .env file.');
  process.exit(1);
}
