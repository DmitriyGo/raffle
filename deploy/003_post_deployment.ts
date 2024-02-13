import { parseUnits } from 'ethers';
import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { ENV, HADRHAT_CHAIN_ID } from '../config';
import { getNetworkConfig } from '../hardhat.network-config';
import { shared, tokens } from '../test/constants/constants';
import { verify } from '../utils';
import { getDeployConfigItem } from '../utils/getDeployConfigItem';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  const chainId = Number(network.config.chainId);

  const vrfSubId = await getDeployConfigItem('vrfSubId', chainId);
  const vrfCoordinatorV2Address = await getDeployConfigItem(
    'vrfCoordinatorV2',
    chainId,
  );

  if (chainId === HADRHAT_CHAIN_ID && vrfCoordinatorV2Address && vrfSubId) {
    const raffle = await deployments.get('Raffle');
    const vrfCoordinatorV2 = await ethers.getContractAt(
      'VRFCoordinatorV2Interface',
      vrfCoordinatorV2Address,
      signer,
    );

    await vrfCoordinatorV2.addConsumer(Number(vrfSubId), raffle.address);
  }
};
func.tags = ['all'];
func.id = 'POST_DEPLOYMENT';

export default func;
