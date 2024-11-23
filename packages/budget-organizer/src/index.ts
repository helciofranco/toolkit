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

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: TELEGRAM_ENABLED });

const currencyBeaconApi = axios.create({
  baseURL: 'https://api.currencybeacon.com/v1',
  params: {
    api_key: process.env.CURRENCYBEACON_API_KEY || '',
  },
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== TELEGRAM_CHAT_ID) {
    console.log(chatId, TELEGRAM_CHAT_ID);
    return;
  }

  const now = dayjs().tz(tz).startOf('day');

  const expenses = getExpenses();
  const firstDay = Object.keys(expenses)[0];

  const past = dayjs.tz(firstDay, tz).startOf('day');
  const diff = now.diff(past, 'day') + 1;

  const totalLimit = roundAmount(diff * LIMIT_AMOUNT);
  const totalSpent = Object.values(expenses).reduce((acc, expense) => {
    return acc + expense.total;
  }, 0);
  const totalRemaining = roundAmount(totalLimit - totalSpent);

  const result = `💰 *Total Spent:* ${totalSpent} ${LIMIT_CURRENCY}\n💰 *Total Remaining:* ${totalRemaining} ${LIMIT_CURRENCY}`;
  console.log(result);
  bot.sendMessage(chatId, result, {
    parse_mode: 'Markdown',
  });
});

bot.onText(/\/today/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== TELEGRAM_CHAT_ID) {
    console.log(chatId, TELEGRAM_CHAT_ID);
    return;
  }

  const today = dayjs().tz(tz).format('YYYY-MM-DD');
  const expenses = getExpenses();

  if (!expenses[today] || !expenses[today].expenses.length) {
    bot.sendMessage(chatId, '📭 No expenses found for today');
    return;
  }

  const todayTotal = expenses[today].total;
  const remaining = roundAmount(LIMIT_AMOUNT - todayTotal);

  const result = `${expenses[today].expenses
    .map((e) => `💸 ${e} ${LIMIT_CURRENCY}`)
    .join(
      '\n',
    )}\n\n💰 *Today:* ${todayTotal} ${LIMIT_CURRENCY}\n🏦 *Available:* ${remaining} ${LIMIT_CURRENCY}`;
  console.log(result);
  bot.sendMessage(chatId, result, {
    parse_mode: 'Markdown',
  });
});

bot.onText(/\/undo/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== TELEGRAM_CHAT_ID) {
    console.log(chatId, TELEGRAM_CHAT_ID);
    return;
  }

  const today = dayjs().tz(tz).format('YYYY-MM-DD');
  const expenses = getExpenses();

  if (!expenses[today] || !expenses[today].expenses.length) {
    bot.sendMessage(chatId, '📭 No expenses found for today');
    return;
  }

  // Remove the last expense
  const lastExpense = expenses[today].expenses.pop();

  if (lastExpense) {
    // Update the total
    expenses[today].total = roundAmount(expenses[today].total - lastExpense);

    // Ensure the total doesn't go negative (in case of bad data)
    if (expenses[today].total < 0) {
      expenses[today].total = 0;
    }
  }

  saveExpenses(expenses);

  const remaining = roundAmount(LIMIT_AMOUNT - expenses[today].total);

  const result = `🗑️ *Removed:* ${lastExpense} ${LIMIT_CURRENCY}\n💰 *Today:* ${expenses[today].total} ${LIMIT_CURRENCY}\n🏦 *Available:* ${remaining} ${LIMIT_CURRENCY}`;
  console.log(result);
  bot.sendMessage(chatId, result, {
    parse_mode: 'Markdown',
  });
});

bot.onText(/^(.*)[ ]([A-Za-z]{3})$/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (chatId !== TELEGRAM_CHAT_ID) {
    console.log(chatId, TELEGRAM_CHAT_ID);
    return;
  }

  if (!match) return;
  const [, amount, _symbol] = match;
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

  let paid = roundAmount(payload.amount);
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

    paid = roundAmount(value);
  }

  // Save expenses
  expenses[today].expenses.push(paid);
  expenses[today].total += paid;
  saveExpenses(expenses);

  // Get available
  const remaining = roundAmount(LIMIT_AMOUNT - expenses[today].total);

  const result = `💸 *Paid:* ${paid} ${LIMIT_CURRENCY}\n💰 *Today:* ${expenses[today].total} ${LIMIT_CURRENCY}\n🏦 *Available:* ${remaining} ${LIMIT_CURRENCY}`;
  console.log(result);
  bot.sendMessage(chatId, result, {
    parse_mode: 'Markdown',
  });
});

bot.sendMessage(TELEGRAM_CHAT_ID, '🚀 Budget organizer have been started');
