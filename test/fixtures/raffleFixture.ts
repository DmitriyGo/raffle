import { deployments } from 'hardhat';

import { localTokensConfig } from '../../helper-hardhat-config';

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
    const priceFeedMock = await ethers.getContractAt(
      'PriceFeedMock',
      ...(await contractArgs('PriceFeedMock')),
    );
    const ac = await ethers.getContractAt(
      'RaffleAccessControl',
      ...(await contractArgs('RaffleAccessControl')),
    );
    const funder = await ethers.getContractAt(
      'ChainlinkFunder',
      ...(await contractArgs('ChainlinkFunder')),
    );
    const raffle = await ethers.getContractAt(
      'Raffle',
      ...(await contractArgs('Raffle')),
    );

    const allowedTokenMock = await ethers.getContractAt(
      'ERC20',
      ...(await contractArgs(localTokensConfig[0].deployment)),
    );
    const blockedTokenMock = await ethers.getContractAt(
      'ERC20',
      ...(await contractArgs(localTokensConfig[1].deployment)),
    );

    return {
      deployer,
      vrfCoordinator,
      allowedTokenMock,
      blockedTokenMock,
      priceFeedMock,
      ac,
      funder,
      raffle,
    };
  },
);
