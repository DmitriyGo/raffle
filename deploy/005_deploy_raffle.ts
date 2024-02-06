import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { networkConfig } from '../helper-hardhat-config';
import { verify } from '../utils';
import { deployStorage } from '../utils/deploy-storage';
import { getNetworkDeployConfig } from '../utils/getNetworkDeployConfig';

const CONTRACT_NAME = 'Raffle';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  const ac = await hre.deployments.get('RaffleAccessControl');
  const funder = await hre.deployments.get('ChainlinkFunder');
  const vrfSubId = await getNetworkDeployConfig('vrfSubId');

  let allowedTokens: string[];
  let vrfCoordinatorV2Address: string | undefined;

  if (chainId === 31337) {
    const allowedTokensMock = await deployStorage.read('allowedTokens');
    if (!Array.isArray(allowedTokensMock)) {
      throw new Error('Invalid allowedTokensMock provided');
    }
    allowedTokens = allowedTokensMock;

    const vrfCoordinator = await hre.deployments.get('VRFCoordinatorMock');
    vrfCoordinatorV2Address = vrfCoordinator.address;
  } else {
    allowedTokens = networkConfig[chainId!].allowedTokens || [];
    vrfCoordinatorV2Address =
      networkConfig[network.config.chainId!].vrfCoordinatorV2;
  }

  console.log('Raffle allowed tokens: ', allowedTokens);

  const result = await deploy(CONTRACT_NAME, {
    from: deployer,
    log: true,
    autoMine: true,
    args: [
      ac.address,
      vrfCoordinatorV2Address,
      funder.address,
      vrfSubId,
      networkConfig[network.config.chainId!].vrfKeyHash,
      networkConfig[network.config.chainId!].keepersUpdateInterval,
      allowedTokens,
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
