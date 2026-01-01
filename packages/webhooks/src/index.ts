import express, { type Request, type Response } from 'express';
import bodyParser from 'body-parser';
import type { AlchemyWebhookData, PayoutWebhookData } from './types';
import { TelegramService } from '@helciofranco/telegram';
import { EXPLORERS_URL, NETWORKS_NAME, VERIFIED_CONTRACTS } from './constants';
import { getShortAddress } from './utils';
import { isSameHex } from './utils/isSameHex';

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
  const explorerUrl = EXPLORERS_URL[data.event.network];
  const networkName = NETWORKS_NAME[data.event.network];
  const verifiedContracts = VERIFIED_CONTRACTS[data.event.network];

  const activities = data.event.activity
    .filter((activity) => {
      const isVerifiedToken = verifiedContracts.some((contract) => {
        return isSameHex(contract, activity.rawContract?.address);
      });
      const isBaseAsset = ['external', 'internal'].includes(activity.category);
      return isVerifiedToken || isBaseAsset;
    })
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

  if (activities.length === 0) {
    return;
  }

  telegramService.sendMessage(`*${networkName}*\n\n${activities}`);
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  telegramService.sendMessage('🚀 Webhooks have been started');
});
