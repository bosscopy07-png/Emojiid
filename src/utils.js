/**
 * Utility functions for emoji extraction and formatting
 */

import { botConfig } from './config.js';

/**
 * Extracts custom emoji entities from a message object
 * Handles both regular messages (entities) and media captions (caption_entities)
 * 
 * @param {Object} message - Telegram message object
 * @returns {Array<{emoji: string, customEmojiId: string, offset: number, length: number}>}
 */
export function extractCustomEmojis(message) {
  const results = [];
  
  // Get the appropriate text and entities based on message type
  const text = message.text || message.caption || '';
  const entities = message.entities || message.caption_entities || [];
  
  // Filter only custom_emoji entities and sort by offset to preserve order
  const customEmojiEntities = entities
    .filter(entity => entity.type === 'custom_emoji')
    .sort((a, b) => a.offset - b.offset);
  
  for (const entity of customEmojiEntities) {
    // Extract the actual emoji character using offset and length
    const emoji = text.substring(entity.offset, entity.offset + entity.length);
    
    results.push({
      emoji,
      customEmojiId: entity.custom_emoji_id,
      offset: entity.offset,
      length: entity.length,
    });
  }
  
  return results;
}

/**
 * Formats extracted emojis into a numbered list with copy-friendly IDs
 * Each ID is wrapped in backticks for easy tap-to-copy on mobile
 * Splits into chunks if message would exceed Telegram's limit
 * 
 * @param {Array<{emoji: string, customEmojiId: string}>} emojis
 * @returns {string[]} Array of message chunks
 */
export function formatEmojiList(emojis) {
  if (emojis.length === 0) {
    return [];
  }
  
  const chunks = [];
  let currentChunk = '';
  
  for (let i = 0; i < emojis.length; i++) {
    // Wrap ID in backticks for easy copy (tap/long-press on mobile)
    // Also add a zero-width space after the emoji to prevent it from being
    // combined with the number on some devices
    const line = `${i + 1}. ${emojis[i].emoji} \u200B= \`${emojis[i].customEmojiId}\`\n`;
    
    // Check if adding this line would exceed Telegram's message limit
    if ((currentChunk.length + line.length) > botConfig.maxMessageLength) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += line;
    }
  }
  
  // Push the final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Creates a summary header for the response
 * 
 * @param {number} totalCount
 * @param {number} chunkIndex
 * @param {number} totalChunks
 * @returns {string}
 */
export function createSummary(totalCount, chunkIndex = 0, totalChunks = 1) {
  if (totalChunks === 1) {
    return `🔍 Found **${totalCount}** premium emoji(s):\n\n`;
  }
  return `🔍 Found **${totalCount}** premium emoji(s) (Part ${chunkIndex + 1}/${totalChunks}):\n\n`;
}
