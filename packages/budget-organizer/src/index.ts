import dotenv from 'dotenv';
import type { Currency, CurrencyBeaconData, ExpenseData } from './types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import { getExpenses, roundAmount, saveExpenses } from './utils';

dotenv.config();
dayjs.extend(utc);
dayjs.extend(timezone);

const LIMIT_AMOUNT: number = process.env.ORGANIZER_LIMIT_AMOUNT
  ? Number(process.env.ORGANIZER_LIMIT_AMOUNT)
  : 0;
const LIMIT_CURRENCY = (process.env.ORGANIZER_LIMIT_CURRENCY ||
  'BRL') as Currency;
const tz = process.env.ORGANIZER_TIMEZONE || 'America/Sao_Paulo';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID || '0');
const TELEGRAM_ENABLED = process.env.TELEGRAM_ENABLED === 'true';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const currencyBeaconApi = axios.create({
  baseURL: 'https://api.currencybeacon.com/v1',
  params: {
    api_key: process.env.CURRENCYBEACON_API_KEY || '',
  },
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== TELEGRAM_CHAT_ID) {
    console.log(chatId, TELEGRAM_CHAT_ID);
    return;
  }

  const [amount, _symbol] = msg.text?.split(' ') || (['0', 'USD'] as const);
  if (!amount || !_symbol) return;
  const symbol = _symbol.toUpperCase() as Currency;

  const payload: ExpenseData = {
    amount: Number(amount),
    symbol: symbol as Currency,
  };
  const today = dayjs().tz(tz).format('YYYY-MM-DD');
  const expenses = getExpenses();

  if (!expenses[today]) {
    expenses[today] = {
      expenses: [],
      total: 0,
    };
  }

  let spent = roundAmount(payload.amount);
  if (payload.symbol !== LIMIT_CURRENCY) {
    const {
      data: { value },
    } = await currencyBeaconApi.get<CurrencyBeaconData>('/convert', {
      params: {
        from: payload.symbol,
        to: LIMIT_CURRENCY,
        amount: payload.amount,
      },
    });

    spent = roundAmount(value);
  }

  // Save expenses
  expenses[today].expenses.push(spent);
  expenses[today].total += spent;
  saveExpenses(expenses);

  // Get available
  const remaining = LIMIT_AMOUNT - expenses[today].total;

  const result = `💸 *Spent:* ${spent} ${LIMIT_CURRENCY}\n💰 *Available:* ${remaining} ${LIMIT_CURRENCY}`;
  if (TELEGRAM_ENABLED) {
    bot.sendMessage(chatId, result, {
      parse_mode: 'Markdown',
    });
    return;
  }

  console.log(result);
});

if (TELEGRAM_ENABLED) {
  bot.sendMessage(TELEGRAM_CHAT_ID, '🚀 Budget organizer have been started');
} else {
  console.log('🚀 Budget organizer have been started');
}
