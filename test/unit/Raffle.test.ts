import { impersonateAccount } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { AddressLike, parseUnits } from 'ethers';
import { ethers } from 'hardhat';

import { IERC20 } from '../../typechain-types';
import { raffleFixture } from '../fixtures/raffleFixture';

describe('Raffle', function () {
  it('should initialize the raffle correctly', async function () {
    const { raffle, deployer } = await raffleFixture();
    const desiredUsdtBalance = parseUnits('1000', 6);
    const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
    const usdtContract = await ethers.getContractAt(
      'IERC20',
      usdtAddress,
      deployer,
    );

    const BET_AMOUNT = parseUnits('20', 6);

    await transferUsdt(usdtContract, deployer, desiredUsdtBalance);
    console.log('usdtBalance ==>', await usdtContract.balanceOf(deployer));

    await usdtContract.approve(raffle, BET_AMOUNT);

    await expect(raffle.enterRaffle(usdtAddress, BET_AMOUNT))
      .to.emit(raffle, 'RaffleEntered')
      .withArgs(deployer.address);
  });
});

async function transferUsdt(contract: IERC20, to: AddressLike, amount: bigint) {
  const usdtHolderAddress = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
  const usdtHolder = await ethers.getSigner(usdtHolderAddress);

  await impersonateAccount(usdtHolderAddress);
  await contract.connect(usdtHolder).transfer(to, amount);
}
