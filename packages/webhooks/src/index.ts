import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import bodyParser from 'body-parser';
import type { AlchemyWebhookData, PayoutWebhookData } from './types';
import { TelegramService } from '@helciofranco/telegram';
import { explorersUrl, networksName } from './constants';
import { getShortAddress } from './utils';

dotenv.config();

const telegramService = new TelegramService(
  process.env.TELEGRAM_CHAT_ID || '',
  process.env.TELEGRAM_BOT_TOKEN || '',
  process.env.TELEGRAM_ENABLED === 'true'
);
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/blindpay', (req: Request, res: Response) => {
  const payload: PayoutWebhookData = req.body;
  handleBlindpay(payload);
  res.status(200).json({ status: 'ok' });
});

app.post('/alchemy', (req: Request, res: Response) => {
  const payload: AlchemyWebhookData = req.body;
  handleAlchemy(payload);
  res.status(200).json({ status: 'ok' });
});

function handleBlindpay(data: PayoutWebhookData) {
  console.log('Handling payout:', data);
  const msg = `💰 Status: ${data.status}\nFrom ${data.sender_wallet_address}\nHash: ${data.tracking_complete.transaction_hash}\n`;
  telegramService.sendMessage(msg);
}

function handleAlchemy(data: AlchemyWebhookData) {
  const explorerUrl = explorersUrl[data.event.network];
  const networkName = networksName[data.event.network];

  const activities = data.event.activity
    .map((activity) => {
      return `From [${getShortAddress(
        activity.fromAddress
      )}](${explorerUrl}/address/${activity.fromAddress}) to [${getShortAddress(
        activity.toAddress
      )}](${explorerUrl}/address/${activity.toAddress})
💰 ${activity.value} ${activity.asset}
🌐 [View on explorer](${explorerUrl}/tx/${activity.hash})`;
    })
    .join('\n\n');

  telegramService.sendMessage(`*${networkName}*\n\n${activities}`);
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  telegramService.sendMessage('🚀 Webhooks have been started');
});
