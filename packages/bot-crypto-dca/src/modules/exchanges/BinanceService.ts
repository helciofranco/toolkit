import type { Buy, BuyParams, Exchange } from './types';
import { config } from '../../config';
import { createHmac } from 'node:crypto';
import axios, { type AxiosInstance } from 'axios';

type BinanceBuy = {
  executedQty: string;
  cummulativeQuoteQty: string;
};

type ServerTime = {
  serverTime: number;
};

export class BinanceService implements Exchange {
  private secret: string;
  private client: AxiosInstance;

  constructor() {
    const { binance } = config;

    this.secret = binance.secret ?? '';
    this.client = axios.create({
      baseURL: binance.url,
      headers: {
        'X-MBX-APIKEY': binance.key,
      },
    });
  }

  async buy({ base, quote, amount }: BuyParams): Promise<Buy> {
    const symbol = `${base}${quote}`;
    const timestamp = await this.getServerTime();
    const queryString = `symbol=${symbol}&side=BUY&type=MARKET&quoteOrderQty=${amount}&timestamp=${timestamp}`;
    const signature = this.createSignature(queryString, this.secret);
    const url = `/order?${queryString}&signature=${signature}`;

    const { data } = await this.client.post<BinanceBuy>(url);
    const qtd = Number.parseFloat(data.cummulativeQuoteQty);

    return {
      executed: data.executedQty,
      paid: qtd.toFixed(2),
      average: (qtd / Number.parseFloat(data.executedQty)).toFixed(2),
    };
  }

  private async getServerTime(): Promise<number> {
    const { data } = await this.client.get<ServerTime>('/time');
    return data.serverTime;
  }

  private createSignature(queryString: string, secretKey: string): string {
    return createHmac('sha256', secretKey).update(queryString).digest('hex');
  }
}
