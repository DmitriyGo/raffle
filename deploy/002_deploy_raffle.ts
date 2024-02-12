import { parseUnits } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { ENV } from '../config';
import { getNetworkConfig } from '../hardhat.network-config';
import { shared, tokens } from '../test/constants/constants';
import { verify } from '../utils';
import { getDeployConfigItem } from '../utils/getDeployConfigItem';

const CONTRACT_NAME = 'Raffle';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = Number(network.config.chainId);
  const networkConfig = getNetworkConfig(chainId);

  const ac = await hre.deployments.get('RaffleAccessControl');

  const vrfSubId = await getDeployConfigItem('vrfSubId', chainId);
  const vrfCoordinatorV2Address = await getDeployConfigItem(
    'vrfCoordinatorV2',
    chainId,
  );

  const result = await deploy(CONTRACT_NAME, {
    from: deployer,
    log: true,
    autoMine: true,
    args: [
      ac.address,
      vrfCoordinatorV2Address,
      shared.uniV2Router,
      networkConfig?.priceFeeds?.nativeToUsd,
      tokens.WETH,
      vrfSubId,
      networkConfig.vrfKeyHash,
      networkConfig.keepersUpdateInterval,
      parseUnits(ENV.MIN_BET_SIZE, 18),
      parseUnits(ENV.MAX_BET_SIZE, 18),
      networkConfig.allowedTokens,
    ],
  });

  if (result.newlyDeployed && result.transactionHash) {
    await verify(
      hre,
      result.address,
      result.transactionHash,
      result.args ?? [],
    );
  }
};
func.tags = ['prod', 'all', CONTRACT_NAME];
func.id = CONTRACT_NAME;

export default func;
