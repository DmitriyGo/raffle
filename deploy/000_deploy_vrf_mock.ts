import { impersonateAccount } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { HADRHAT_CHAIN_ID } from '../config';
import { deployStorage } from '../utils/deploy-storage';

const CONTRACT_NAME = 'VRFCoordinatorMock';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = Number(network.config.chainId);

  if (chainId !== HADRHAT_CHAIN_ID) return;

  try {
    const deployed = await hre.deployments.get(CONTRACT_NAME);
    console.log(
      `${CONTRACT_NAME} is already deployed, address: ${deployed.address}`,
    );

    return;
  } catch (e) {
    console.log('Deploying VRFCoordinatorMocked...');
  }

  const { address: vrfCoordinatorV2Address } = await deploy(CONTRACT_NAME, {
    from: deployer,
    args: [1, 1],
    log: true,
    autoMine: true,
  });

  const vrfCoordinatorMock = await ethers.getContractAt(
    CONTRACT_NAME,
    vrfCoordinatorV2Address,
    await ethers.getSigner(deployer),
  );

  await impersonateAccount(vrfCoordinatorV2Address);
  const vrfSubId = await vrfCoordinatorMock.createSubscription.staticCall();
  await vrfCoordinatorMock.createSubscription();

  console.log('VRF Subcsription Id:', vrfSubId);
  await deployStorage.write('vrfCoordinatorV2', vrfCoordinatorV2Address);
  await deployStorage.write('vrfSubId', String(vrfSubId));
};

func.tags = ['all', CONTRACT_NAME];
func.id = CONTRACT_NAME;

export default func;
