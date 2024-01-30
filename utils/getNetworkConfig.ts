import { network } from 'hardhat';

import { NetworkConfigKey, deployStorage } from './deploy-storage';

import { networkConfig } from '../helper-hardhat-config';

export async function getNetworkConfig(
  key: NetworkConfigKey,
): Promise<string | string[]> {
  const chainId = network.config.chainId!;

  if (chainId === 31337) {
    const value = await deployStorage.read(key);
    if (!value)
      throw new Error(
        `No value for key: ${key} was provided in test environment`,
      );
    return value;
  }

  const value = networkConfig[chainId][key];
  if (!value)
    throw new Error(
      `No value for key: ${key} was provided in networkConfig for chain ${chainId}`,
    );
  return value;
}
