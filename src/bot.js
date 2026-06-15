/**
 * Premium Emoji ID Extractor Bot
 * 
 * A Telegram bot that extracts custom_emoji_id from premium emojis
 * sent by users in messages and captions.
 * 
 * Built with Telegraf (ES Modules)
 */

import { Telegraf } from 'telegraf';
import { botConfig } from './config.js';
import { logger } from './logger.js';
import { extractCustomEmojis, formatEmojiList, createSummary } from './utils.js';

// ═══════════════════════════════════════════════════════════════
// BOT INITIALIZATION
// ═══════════════════════════════════════════════════════════════

const bot = new Telegraf(botConfig.token);

// ═══════════════════════════════════════════════════════════════
// COMMAND HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * /start - Welcome message and usage instructions
 */
bot.command('start', async (ctx) => {
  const welcomeMessage = `
🎉 *Welcome to Premium Emoji ID Extractor Bot!*

Send me any message containing *Telegram Premium emojis* (custom emojis), and I'll extract their unique IDs for you.

*How to use:*
1. Have a Telegram Premium account
2. Send a message with custom emojis
3. I'll reply with the \`custom_emoji_id\` for each one

*Commands:*
/start - Show this welcome message
/help - Show detailed help

*Features:*
✅ Supports 1 to 1000+ emojis per message
✅ Preserves original order
✅ Works with text messages and captions
✅ Handles media with emoji captions
✅ *Tap any ID to copy it instantly*

*Example:*
Send: 🎉 💯 🫠
Receive:
1. 🎉 = \`688987777798\`
2. 💯 = \`6889990087544\`
3. 🫠 = \`3365226743455\`

💡 *Tip: Tap any ID to copy it!*
`;

  try {
    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    logger.info('User started bot', { userId: ctx.from?.id, username: ctx.from?.username });
  } catch (error) {
    logger.error('Failed to send start message', { error: error.message, userId: ctx.from?.id });
  }
});

/**
 * /help - Detailed help information
 */
bot.command('help', async (ctx) => {
  const helpMessage = `
📖 *Premium Emoji ID Extractor Bot - Help*

*What are Premium Emojis?*
Telegram Premium users can send custom animated emojis. Each has a unique \`custom_emoji_id\`.

*How to send Premium Emojis:*
1. Tap the emoji button in the message composer
2. Select the "Premium" tab
3. Choose any animated emoji

*What this bot does:*
• Detects all \`custom_emoji\` entities in your message
• Extracts the \`custom_emoji_id\` for each emoji
• Returns them as a numbered list

*How to copy an ID:*
• *Mobile:* Long-press or tap the ID (wrapped in \`code\`) to copy
• *Desktop:* Click the ID to select it, then Ctrl+C

*Supported message types:*
• Text messages with inline emojis
• Photo/video captions with emojis
• Documents with emoji captions
• Any media with caption entities

*Limits:*
• Up to ${botConfig.maxEmojisPerBatch} emojis per message
• Messages are split if response exceeds Telegram limits

*Tips:*
• You can send multiple emojis in one message
• The bot preserves the exact order they appear
• Both text and media captions are supported
• *Tap any ID to copy it instantly!*
`;

  try {
    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    logger.info('User requested help', { userId: ctx.from?.id });
  } catch (error) {
    logger.error('Failed to send help message', { error: error.message, userId: ctx.from?.id });
  }
});

// ═══════════════════════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Main handler for text messages and media captions
 * Extracts custom emoji entities and replies with their IDs
 */
async function handleMessage(ctx) {
  const message = ctx.message;
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const chatId = ctx.chat?.id;
  
  logger.info('Processing message', { 
    userId, 
    username, 
    chatId,
    messageId: message.message_id,
    hasText: !!message.text,
    hasCaption: !!message.caption,
  });

  try {
    // Extract custom emojis from the message
    const emojis = extractCustomEmojis(message);
    
    // Log all detected emoji IDs for analytics/debugging
    if (emojis.length > 0) {
      logger.info('Detected custom emojis', {
        userId,
        count: emojis.length,
        emojiIds: emojis.map(e => e.customEmojiId),
      });
    }

    // No premium emojis found
    if (emojis.length === 0) {
      await ctx.reply('No Telegram Premium custom emojis found in this message.');
      logger.info('No custom emojis found', { userId, messageId: message.message_id });
      return;
    }

    // Safety check: prevent processing extremely large batches
    if (emojis.length > botConfig.maxEmojisPerBatch) {
      await ctx.reply(`⚠️ Too many emojis detected (${emojis.length}). Maximum supported is ${botConfig.maxEmojisPerBatch}.`);
      logger.warn('Emoji limit exceeded', { userId, count: emojis.length });
      return;
    }

    // Format the emoji list into chunks (handles Telegram message length limits)
    const formattedChunks = formatEmojiList(emojis);
    const totalChunks = formattedChunks.length;

    // Send each chunk as a separate message
    for (let i = 0; i < formattedChunks.length; i++) {
      const summary = createSummary(emojis.length, i, totalChunks);
      const fullMessage = summary + formattedChunks[i];
      
      await ctx.reply(fullMessage, { parse_mode: 'Markdown' });
      
      logger.debug('Sent emoji chunk', { 
        userId, 
        chunk: i + 1, 
        totalChunks,
        chunkLength: fullMessage.length,
      });
    }

    logger.info('Successfully processed emojis', { 
      userId, 
      count: emojis.length, 
      chunks: totalChunks,
    });

  } catch (error) {
    logger.error('Error processing message', { 
      error: error.message, 
      stack: error.stack,
      userId,
      messageId: message.message_id,
    });
    
    await ctx.reply('❌ An error occurred while processing your message. Please try again.');
  }
}

// Register handlers for all message types that can contain text/captions
bot.on('text', handleMessage);
bot.on('photo', handleMessage);
bot.on('video', handleMessage);
bot.on('animation', handleMessage);
bot.on('document', handleMessage);
bot.on('audio', handleMessage);
bot.on('voice', handleMessage);
bot.on('video_note', handleMessage);

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

// Catch Telegraf errors
bot.catch((err, ctx) => {
  logger.error('Telegraf error', { 
    error: err.message, 
    stack: err.stack,
    updateType: ctx.updateType,
    userId: ctx.from?.id,
  });
});

// Handle graceful shutdown
process.once('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  bot.stop('SIGTERM');
});

// ═══════════════════════════════════════════════════════════════
// START BOT
// ═══════════════════════════════════════════════════════════════

async function startBot() {
  try {
    // Use long polling (recommended for most use cases)
    // For production with webhooks, use: await bot.launch({ webhook: { ... } })
    await bot.launch();
    
    logger.info('🤖 Bot started successfully!', {
      mode: 'polling',
      logLevel: botConfig.logLevel,
      maxEmojis: botConfig.maxEmojisPerBatch,
    });
    
    console.log('🤖 Premium Emoji ID Extractor Bot is running...');
    console.log('Press Ctrl+C to stop.');
    
  } catch (error) {
    logger.error('Failed to start bot', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startBot();
