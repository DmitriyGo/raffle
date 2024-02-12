import { expect } from 'chai';
import { parseUnits } from 'ethers';
import { ethers } from 'hardhat';

import { raffleFixture } from '../fixtures/raffleFixture';
import { increaseTime } from '../helpers/increaseTime';
import { transferUsdt } from '../helpers/transferUsdt';

describe('Raffle', function () {
  it('should initialize the raffle correctly', async function () {
    const { raffle, deployer } = await raffleFixture();
    const desiredUsdtBalance = parseUnits('1000', 6);
    const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const usdtContract = await ethers.getContractAt(
      'IERC20',
      usdtAddress,
      deployer,
    );

    const BET_AMOUNT = parseUnits('20', 6);

    await transferUsdt(usdtContract, deployer, desiredUsdtBalance);
    console.log('usdtBalance ==>', await usdtContract.balanceOf(deployer));

    await usdtContract.approve(raffle, BET_AMOUNT);

    const { upkeepNeeded: upkeepNeeded1 } = await raffle.checkUpkeep('0x');
    console.log('upkeepNeeded ==>', upkeepNeeded1);

    await expect(raffle.enterRaffle(usdtAddress, BET_AMOUNT))
      .to.emit(raffle, 'RaffleEntered')
      .withArgs(deployer.address, usdtAddress, BET_AMOUNT);
    await increaseTime(30);

    const { upkeepNeeded: upkeepNeeded2 } = await raffle.checkUpkeep('0x');
    console.log('upkeepNeeded ==>', upkeepNeeded2);
  });
});
