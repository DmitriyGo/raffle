import { deployStorage } from './deploy-storage';

import { HADRHAT_CHAIN_ID } from '../config';
import { NetworkConfigItem, getNetworkConfig } from '../hardhat.network-config';

export const getDeployConfigItem = async (
  key: keyof NetworkConfigItem,
  chainId: number,
) => {
  if (chainId === HADRHAT_CHAIN_ID) {
    const value = await deployStorage.read(key);
    if (!value)
      throw new Error(
        `No value for key: ${key} was provided in test environment`,
      );
    return value;
  }

  const networkConfig = getNetworkConfig(chainId);
  const value = networkConfig[key];
  if (!value)
    throw new Error(
      `No value for key: ${key} was provided in networkConfig for chain ${chainId}`,
    );
  return value;
};
