import type { AlchemyNetwork, Network } from './types';

export const NETWORKS: Record<AlchemyNetwork, Network> = {
  ETH_MAINNET: {
    name: 'Ethereum',
    explorerUrl: 'https://etherscan.io',
    assets: [
      { symbol: 'ETH', address: '0x', minAmount: 0.002 },
      {
        symbol: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        minAmount: 1,
      },
      {
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        minAmount: 1,
      },
      {
        symbol: 'WBTC',
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        minAmount: 0.00001,
      },
      {
        symbol: 'PAXG',
        address: '0x45804880De22913dAFE09f4980848ECE6EcbAf78',
        minAmount: 0.002,
      },
      {
        symbol: 'SHIB',
        address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
        minAmount: 50_000,
      },
    ],
  },
  ARB_MAINNET: {
    name: 'Arbitrum',
    explorerUrl: 'https://arbiscan.io',
    assets: [
      { symbol: 'ETH', address: '0x', minAmount: 0.002 },
      {
        symbol: 'USDC',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        minAmount: 1,
      },
      {
        symbol: 'USDT',
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        minAmount: 1,
      },
    ],
  },
};
