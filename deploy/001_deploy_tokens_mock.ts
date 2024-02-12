import chalk from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { HADRHAT_CHAIN_ID } from '../config';
import { localTokensConfig } from '../hardhat.network-config';
import { verify } from '../utils';
import { deployStorage } from '../utils/deploy-storage';

const CONTRACT_NAME = 'ERC20Mock';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { network, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = Number(network.config.chainId);

  if (chainId !== HADRHAT_CHAIN_ID) return;

  const allowedTokens: string[] = [];

  for (const tokenDetail of localTokensConfig) {
    const { name, symbol, initialSupply } = tokenDetail.args;

    console.log(
      chalk.bold.blue('Deploying mock token: ', tokenDetail.deployment),
    );

    const result = await deploy(tokenDetail.deployment, {
      from: deployer,
      log: true,
      autoMine: true,
      contract: CONTRACT_NAME,
      args: [name, symbol, initialSupply],
    });

    if (tokenDetail.allowed) {
      allowedTokens.push(result.address);
    }

    if (result.newlyDeployed && result.transactionHash) {
      await verify(hre, result.address, result.transactionHash, [
        name,
        symbol,
        initialSupply,
      ]);
    }
  }

  await deployStorage.write('allowedTokens', allowedTokens);
};

func.tags = ['predeploy', 'all', CONTRACT_NAME];
func.id = CONTRACT_NAME;

export default func;
