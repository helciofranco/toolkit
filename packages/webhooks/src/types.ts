export type PayoutWebhookData = {
  id: string;
  status: 'processing' | 'failed' | 'refunded' | 'completed';
  sender_wallet_address: string;
  tracking_complete: {
    step: 'processing' | 'on_hold' | 'completed';
    status: string | null;
    transaction_hash: string | null;
    completed_at: string | null;
  };
  tracking_payment: {
    step: 'processing' | 'on_hold' | 'completed';
    provider_name: string | null;
    provider_transaction_id: string | null;
    provider_status: 'canceled' | 'failed' | 'returned' | 'sent';
    estimated_time_of_arrival: string | null;
    completed_at: string | null;
  };
  tracking_transaction: {
    step: 'processing' | 'on_hold' | 'completed';
    status: 'failed' | 'found' | null;
    transaction_hash: string | null;
    completed_at: string | null;
  };
};

export type AlchemyNetwork = 'ETH_MAINNET' | 'ARB_MAINNET';

type AlchemyWebhookActivity = {
  blockNum: `0x${string}`;
  hash: `0x${string}`;
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  value: number;
  asset: string;
  category: 'external' | 'internal' | 'token';
  rawContract?: {
    address: `0x${string}`;
  };
};

export type AlchemyWebhookData = {
  event: {
    network: AlchemyNetwork;
    activity: AlchemyWebhookActivity[];
  };
};
