import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { networkConfig } from '../helper-hardhat-config';
import { verify } from '../utils';
import { deployStorage } from '../utils/deploy-storage';

const CONTRACT_NAME = 'Raffle';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;

  const ac = await hre.deployments.get('RaffleAccessControl');
  const vrf = await hre.deployments.get('RaffleVRF');
  const funder = await hre.deployments.get('ChainlinkFunder');

  let allowedTokens: string[];

  if (chainId === 31337) {
    const allowedTokensMock = await deployStorage.read('allowedTokens');
    if (!Array.isArray(allowedTokensMock)) {
      throw new Error('Invalid allowedTokensMock provided');
    }
    allowedTokens = allowedTokensMock;
  } else {
    allowedTokens = networkConfig[chainId!].allowedTokens || [];
  }

  console.log('Raffle allowed tokens: ', allowedTokens);

  const result = await deploy(CONTRACT_NAME, {
    from: deployer,
    log: true,
    autoMine: true,
    args: [ac.address, vrf.address, funder.address, allowedTokens],
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
