import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { networkConfig } from '../helper-hardhat-config';
import { shared, tokens, vrfConstants } from '../test/constants/constants';
import { verify } from '../utils';
import { getNetworkDeployConfig } from '../utils/getNetworkDeployConfig';

const CONTRACT_NAME = 'ChainlinkFunder';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  const ac = await hre.deployments.get('RaffleAccessControl');
  const vrfSubId = await getNetworkDeployConfig('vrfSubId');

  let vrfCoordinatorV2Address: string | undefined;

  if (chainId === 31337) {
    const vrfCoordinator = await hre.deployments.get('VRFCoordinatorMock');
    vrfCoordinatorV2Address = vrfCoordinator.address;
  } else {
    vrfCoordinatorV2Address =
      networkConfig[network.config.chainId!].vrfCoordinatorV2;
  }

  const result = await deploy(CONTRACT_NAME, {
    from: deployer,
    args: [
      ac.address,
      vrfSubId,
      tokens.LINK,
      vrfCoordinatorV2Address,
      networkConfig[chainId!].priceFeeds.nativeToUsd,
      networkConfig[chainId!].priceFeeds.linkToUsd,
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
