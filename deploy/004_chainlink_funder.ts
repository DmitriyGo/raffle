import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getNetworkConfig } from '../hardhat.network-config';
import { shared, tokens, vrfConstants } from '../test/constants/constants';
import { verify } from '../utils';
import { getDeployConfigItem } from '../utils/getDeployConfigItem';

const CONTRACT_NAME = 'ChainlinkFunder';

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
    args: [
      ac.address,
      vrfSubId,
      tokens.LINK,
      vrfCoordinatorV2Address,
      networkConfig?.priceFeeds?.nativeToUsd,
      networkConfig?.priceFeeds?.linkToUsd,
      shared.uniV2Router,
      vrfConstants.nativeToLinkPath,
    ],
    log: true,
    autoMine: true,
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
