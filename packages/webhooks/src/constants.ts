import type { AlchemyNetwork } from './types';

export const EXPLORERS_URL: Record<AlchemyNetwork, string> = {
  ETH_MAINNET: 'https://etherscan.io',
  ARB_MAINNET: 'https://arbiscan.io',
};

export const NETWORKS_NAME: Record<AlchemyNetwork, string> = {
  ETH_MAINNET: 'Ethereum',
  ARB_MAINNET: 'Arbitrum',
};

export const VERIFIED_CONTRACTS: Record<AlchemyNetwork, `0x${string}`[]> = {
  ETH_MAINNET: [
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // wBTC
    '0x45804880De22913dAFE09f4980848ECE6EcbAf78', // PAXG
    '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIB
  ],
  ARB_MAINNET: [
    '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
  ],
};
