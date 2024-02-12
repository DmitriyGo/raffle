import { deployments } from 'hardhat';

export const raffleFixture = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }) => {
    const deployerAddress = (await getNamedAccounts()).deployer;
    const deployer = await ethers.getSigner(deployerAddress);
    await deployments.fixture(['all']);

    const contractArgs = async (contract: string) =>
      [(await deployments.get(contract)).address, deployer] as const;

    const vrfCoordinator = await ethers.getContractAt(
      'VRFCoordinatorMock',
      ...(await contractArgs('VRFCoordinatorMock')),
    );
    const ac = await ethers.getContractAt(
      'RaffleAccessControl',
      ...(await contractArgs('RaffleAccessControl')),
    );
    const raffle = await ethers.getContractAt(
      'Raffle',
      ...(await contractArgs('Raffle')),
    );

    raffle.setTokenEthPriceFeed(
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT -> ETH
      '0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46',
    );

    return {
      deployer,
      vrfCoordinator,
      ac,
      raffle,
    };
  },
);
