import TelegramBot, { type Message } from 'node-telegram-bot-api';
import { config } from './config';

export const bot = new TelegramBot(config.telegram.token, {
  polling: config.telegram.enabled,
});

export class TelegramMessager {
  private msg: Message;

  constructor(msg: Message) {
    this.msg = msg;
  }

  isUserWhitelisted(): boolean {
    return !config.telegram.whiteList.includes(this.msg.from?.username || '');
  }

  async send(message: string): Promise<void> {
    if (!config.telegram.enabled) return;
    await bot.sendMessage(this.msg.chat.id, message, {
      parse_mode: 'Markdown',
    });
  }
}
