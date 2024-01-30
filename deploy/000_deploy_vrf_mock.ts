import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { deployStorage } from '../utils/deploy-storage';

const CONTRACT_NAME = 'VRFCoordinatorMock';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const deployed = await hre.deployments.getOrNull(CONTRACT_NAME);

  if (deployed) {
    return console.log(
      `${CONTRACT_NAME} is already deployed, address: ${deployed.address}`,
    );
  }

  if (network.config.chainId === 31337) {
    console.log('Deploying test VRFCoordinatorMock...');

    await deploy(CONTRACT_NAME, {
      from: deployer,
      args: [1, 1],
      log: true,
      autoMine: true,
    });

    const { address } = await deployments.get(CONTRACT_NAME);
    const vrfCoordinatorMock = await ethers.getContractAt(
      CONTRACT_NAME,
      address,
      await ethers.getSigner(deployer),
    );

    const vrfSubId = await vrfCoordinatorMock.createSubscription.staticCall();
    await vrfCoordinatorMock.createSubscription();

    console.log('VRF Subcsription Id:', vrfSubId);
    await deployStorage.save('vrfSubId', String(vrfSubId));
  }
};
func.tags = ['predeploy', 'all', CONTRACT_NAME];
func.id = CONTRACT_NAME;

export default func;
