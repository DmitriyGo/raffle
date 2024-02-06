import { raffleFixture } from '../fixtures/raffleFixture';

describe('Raffle', function () {
  it('should initialize the raffle correctly', async function () {
    const {
      deployer,
      vrfCoordinator,
      allowedTokenMock,
      blockedTokenMock,
      priceFeedMock,
      ac,
      funder,
      raffle,
    } = await raffleFixture();

    // const [, price] = await priceFeedMock.latestRoundData();
    // console.log('price ==>', price);

    const asd = await funder.getMinRequiredNativeToFund();
    console.log('asd ==>', Number(asd) / 1e18);
  });
});
