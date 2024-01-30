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
      vrf,
      funder,
      raffle,
    } = await raffleFixture();

    const [, price] = await priceFeedMock.latestRoundData();
    console.log('price ==>', price);
  });

  it('should get correct price', async function () {
    const {
      deployer,
      vrfCoordinator,
      allowedTokenMock,
      blockedTokenMock,
      priceFeedMock,
      ac,
      vrf,
      funder,
      raffle,
    } = await raffleFixture();

    const [, price] = await priceFeedMock.latestRoundData();
    console.log('price 2 ==>', price);
  });
});
