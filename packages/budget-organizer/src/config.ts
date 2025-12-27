import dotenv from 'dotenv';

dotenv.config();

export const config = {
  timezone: process.env.ORGANIZER_TIMEZONE || 'America/Sao_Paulo',
  currencyBeacon: {
    apiKey: process.env.CURRENCYBEACON_API_KEY || '',
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    whiteList: process.env.TELEGRAM_USERNAME_WHITELIST
      ? process.env.TELEGRAM_USERNAME_WHITELIST.split(',')
      : [],
    enabled: process.env.TELEGRAM_ENABLED === 'true',
  },
};
