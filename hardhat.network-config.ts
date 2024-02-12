import { parseUnits } from 'ethers';

import { ChainId } from './config/enums/chains';

export type NetworkConfigItem = {
  name?: string;
  vrfKeyHash?: string;
  keepersUpdateInterval?: string;
  callbackGasLimit?: string;
  vrfCoordinatorV2?: string;
  vrfSubId?: string;
  allowedTokens?: string[];
  priceFeeds?: {
    nativeToUsd: string;
    linkToUsd: string;
  };
};

export const networkConfig: Record<ChainId, NetworkConfigItem> = {
  [ChainId.LOCALHOST]: {
    name: 'localhost',
    vrfKeyHash:
      '0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef', // 200 gwei Key Hash (Ethereum)
    keepersUpdateInterval: '30',
    callbackGasLimit: '500000', // 500,000 gas
    // mainnet price feeds
    allowedTokens: [
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    ],
    priceFeeds: {
      nativeToUsd: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      linkToUsd: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
    },
  },
  [ChainId.SEPOLIA]: {
    name: 'sepolia',
    vrfSubId: '',
    vrfKeyHash:
      '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c', // 30 gwei
    keepersUpdateInterval: '30',
    callbackGasLimit: '500000', // 500,000 gas
    vrfCoordinatorV2: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
    allowedTokens: [
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    ],
    priceFeeds: {
      nativeToUsd: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
      linkToUsd: '0xc59E3633BAAC79493d908e63626716e204A45EdF',
    },
  },
  [ChainId.MAINNET]: {
    name: 'mainnet',
    keepersUpdateInterval: '30',
    allowedTokens: [
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    ],
    priceFeeds: {
      nativeToUsd: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      linkToUsd: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
    },
  },
};

export const getNetworkConfig = (chainId: number): NetworkConfigItem => {
  const isChainIdValid = Object.values(ChainId).includes(chainId);

  if (!isChainIdValid) {
    throw new Error(`Invalid chain id: ${chainId}`);
  }

  return networkConfig[chainId as ChainId];
};
