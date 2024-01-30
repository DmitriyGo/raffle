// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceFeedMock is AggregatorV3Interface {
  int256 private _price;
  uint8 private immutable i_decimals;
  uint80 private _roundId;
  uint256 private _updatedAt;

  event PriceUpdated(int256 price, uint80 roundId);

  constructor(int256 price, uint8 _decimals) {
    _price = price;
    i_decimals = _decimals;
    _roundId = 1;
    _updatedAt = block.timestamp;
  }

  function setPrice(int256 price) public {
    _price = price;
    _roundId++;
    _updatedAt = block.timestamp;
    emit PriceUpdated(price, _roundId);
  }

  function decimals() external view override returns (uint8) {
    return i_decimals;
  }

  function description() external pure override returns (string memory) {
    return "PriceFeedMock";
  }

  function version() external pure override returns (uint256) {
    return 1;
  }

  function latestRoundData()
    external
    view
    override
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
  {
    return (_roundId, _price, _updatedAt, _updatedAt, _roundId);
  }

  function getRoundData(
    uint80 /* _roundId */
  )
    external
    view
    override
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
  {
    require(_roundId <= _roundId, "Round ID does not exist.");
    return (_roundId, _price, _updatedAt, _updatedAt, _roundId);
  }
}
