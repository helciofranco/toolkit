import TelegramBot, { type SendMessageOptions } from 'node-telegram-bot-api';
import { config } from './config';

export const bot = new TelegramBot(config.telegram.token, {
  polling: config.telegram.enabled,
});

export const sendTelegramMessage = async (
  chatId: number,
  message: string,
  options?: SendMessageOptions,
): Promise<void> => {
  if (!config.telegram.enabled) return;
  await bot.sendMessage(chatId, message, options);
};
