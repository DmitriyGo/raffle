// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import {ChainlinkFunder} from "./vrf/ChainlinkFunder.sol";
import {IRaffleVRF} from "./interfaces/IRaffleVRF.sol";
import {RaffleAccessControlMain} from "./access/RaffleAccessControlMain.sol";

import "hardhat/console.sol";

contract Raffle is RaffleAccessControlMain {
  using SafeERC20 for IERC20;

  IRaffleVRF public immutable i_vrf;
  ChainlinkFunder public immutable i_chainLinkFunder;

  bool public gameStarted;
  mapping(address => bool) public isTokenAllowed;
  mapping(address => address) public tokenPriceFeedMapping;

  modifier coverChainLinkExpenses() {
    i_chainLinkFunder.fund{value: msg.value}();
    _;
  }

  constructor(
    address _ac,
    address _vrf,
    address _chainLinkFunder,
    address[] memory allowedTokens
  ) RaffleAccessControlMain(_ac) {
    i_vrf = IRaffleVRF(_vrf);
    i_chainLinkFunder = ChainlinkFunder(_chainLinkFunder);

    for (uint256 i = 0; i < allowedTokens.length; i++) {
      isTokenAllowed[allowedTokens[i]] = true;
    }
  }

  function setTokenPriceFeed(address token, address priceFeed) external onlyAdmin {
    tokenPriceFeedMapping[token] = priceFeed;
  }

  function getTokenPrice(address token) public view returns (int) {
    AggregatorV3Interface priceFeed = AggregatorV3Interface(tokenPriceFeedMapping[token]);
    (, int price, , , ) = priceFeed.latestRoundData();
    return price;
  }

  function playGame(address token, uint256 betAmount, bytes memory data) external payable coverChainLinkExpenses {}
}
