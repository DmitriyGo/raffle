import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const CONTRACT_NAME = 'PriceFeedMock';

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
    console.log('Deploying test PriceFeedMock...');

    await deploy(CONTRACT_NAME, {
      from: deployer,
      args: [100, 18],
      log: true,
      autoMine: true,
    });
  }
};
func.tags = ['predeploy', 'all', CONTRACT_NAME];
func.id = CONTRACT_NAME;

export default func;
