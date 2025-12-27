import axios from 'axios';
import type { Currency, CurrencyBeaconData } from './types';
import { config } from './config';

type ConvertAmountParams = {
  from: Currency;
  to: Currency;
  amount: number;
};

const currencyBeaconApi = axios.create({
  baseURL: 'https://api.currencybeacon.com/v1',
  params: {
    api_key: config.currencyBeacon.apiKey,
  },
});

export const convertAmount = async ({
  from,
  to,
  amount,
}: ConvertAmountParams): Promise<CurrencyBeaconData> => {
  const { data } = await currencyBeaconApi.get<CurrencyBeaconData>('/convert', {
    params: {
      from,
      to,
      amount,
    },
  });

  return data;
};
