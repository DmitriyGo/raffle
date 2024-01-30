import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { networkConfig } from '../helper-hardhat-config';
import { verify } from '../utils';
import { getNetworkConfig } from '../utils/getNetworkConfig';

const CONTRACT_NAME = 'RaffleVRF';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  const ac = await hre.deployments.get('RaffleAccessControl');
  const vrfSubId = await getNetworkConfig('vrfSubId');

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
      vrfCoordinatorV2Address,
      vrfSubId,
      networkConfig[network.config.chainId!].gasLane,
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
