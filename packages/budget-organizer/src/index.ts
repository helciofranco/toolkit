import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import bodyParser from 'body-parser';
import {
  type ExpenseByCurrency,
  symbols,
  type CurrencyBeaconData,
  type ExpenseData,
  type Currency,
} from './types';
import { TelegramService } from '@helciofranco/telegram';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import { formatAmountsToMessage, getExpenses, saveExpenses } from './utils';

dotenv.config();
dayjs.extend(utc);
dayjs.extend(timezone);

const LIMIT_AMOUNT: number = process.env.ORGANIZER_LIMIT_AMOUNT
  ? Number(process.env.ORGANIZER_LIMIT_AMOUNT)
  : 0;
const LIMIT_CURRENCY = (process.env.ORGANIZER_LIMIT_CURRENCY ||
  'BRL') as Currency;
const tz = process.env.ORGANIZER_TIMEZONE || 'America/Sao_Paulo';

const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '';

const telegramService = new TelegramService(
  process.env.TELEGRAM_CHAT_ID || '',
  process.env.TELEGRAM_BOT_TOKEN || '',
  process.env.TELEGRAM_ENABLED === 'true',
);
const app = express();
const PORT = 3003;

const bot = new TelegramBot(telegramToken, { polling: true });

const currencyBeaconApi = axios.create({
  baseURL: 'https://api.currencybeacon.com/v1',
  params: {
    api_key: process.env.CURRENCYBEACON_API_KEY || '',
  },
});

app.use(bodyParser.json());

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (
    process.env.TELEGRAM_CHAT_ID &&
    chatId !== Number(process.env.TELEGRAM_CHAT_ID)
  ) {
    console.log(chatId, Number(process.env.TELEGRAM_CHAT_ID));
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
      totals: symbols.reduce((acc, symbol) => {
        acc[symbol] = 0;
        return acc;
      }, {} as ExpenseByCurrency),
    };
  }

  const {
    data: { rates: conversionRatesSpent },
  } = await currencyBeaconApi.get<CurrencyBeaconData>('/latest', {
    params: {
      base: payload.symbol,
      symbols: symbols.join(','),
    },
  });

  const {
    data: { rates: conversionRatesLimit },
  } = await currencyBeaconApi.get<CurrencyBeaconData>('/latest', {
    params: {
      base: LIMIT_CURRENCY,
      symbols: symbols.join(','),
    },
  });

  const convertedSpentAmounts = symbols.reduce((acc, symbol) => {
    const amount = payload.amount * conversionRatesSpent[symbol];
    acc[symbol] = amount;
    return acc;
  }, {} as ExpenseByCurrency);

  expenses[today].expenses.push(convertedSpentAmounts);
  expenses[today].totals = symbols.reduce((acc, symbol) => {
    acc[symbol] += convertedSpentAmounts[symbol];
    return acc;
  }, expenses[today].totals);

  saveExpenses(expenses);

  const totals = expenses[today].totals;

  const dailyLimitsByCurrency = symbols.reduce((acc, symbol) => {
    const amount = LIMIT_AMOUNT * conversionRatesLimit[symbol];
    acc[symbol] = amount;
    return acc;
  }, {} as ExpenseByCurrency);

  const remainingBudgetByCurrency = symbols.reduce((acc, symbol) => {
    acc[symbol] = dailyLimitsByCurrency[symbol] - totals[symbol];
    return acc;
  }, {} as ExpenseByCurrency);

  bot.sendMessage(
    chatId,
    `💸 *Spent*\n${formatAmountsToMessage(convertedSpentAmounts)}\n\n💰 *Available:*\n${formatAmountsToMessage(remainingBudgetByCurrency)}`,
    {
      parse_mode: 'Markdown',
    },
  );
});

app.get('/expenses/:date', async (req: Request, res: Response) => {
  const date = req.params.date;
  const expenses = getExpenses();

  const { data } = await currencyBeaconApi.get<CurrencyBeaconData>('/latest', {
    params: {
      base: LIMIT_CURRENCY,
      symbols: symbols.join(','),
    },
  });
  const rates = data.rates;

  const empty = symbols.reduce((acc, symbol) => {
    acc[symbol] = 0;
    return acc;
  }, {} as ExpenseByCurrency);
  const totals = expenses[date]?.totals ?? empty;

  const available = symbols.reduce((acc, symbol) => {
    const amount = LIMIT_AMOUNT * rates[symbol];
    acc[symbol] = amount - totals[symbol];
    return acc;
  }, {} as ExpenseByCurrency);

  res.status(200).json({ totals, available });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  telegramService.sendMessage('🚀 Budget organizer have been started');
});
