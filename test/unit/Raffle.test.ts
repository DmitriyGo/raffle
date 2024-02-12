import { expect } from 'chai';
import { parseUnits } from 'ethers';

import { raffleFixture } from '../fixtures/raffleFixture';

describe('Raffle', function () {
  it('should initialize the raffle correctly', async function () {
    const { allowedTokenMock, raffle, deployer } = await raffleFixture();

    const BET_AMOUNT = parseUnits('20', 18);
    const allowedTokenAddress = await allowedTokenMock.getAddress();

    await allowedTokenMock
      .connect(deployer)
      .approve(await raffle.getAddress(), BET_AMOUNT);

    await expect(raffle.enterRaffle(allowedTokenAddress, BET_AMOUNT))
      .to.emit(raffle, 'RaffleEntered')
      .withArgs(deployer.address);
  });
});
