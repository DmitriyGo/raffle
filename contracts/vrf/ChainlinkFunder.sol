// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/shared/token/ERC677/IERC677.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../libraries/DecimalsCorrectionLibrary.sol";
import "../access/RaffleAccessControlMain.sol";
import "../interfaces/IUniswapV2Router02.sol";

import "hardhat/console.sol";

contract ChainlinkFunder is RaffleAccessControlMain {
  using DecimalsCorrectionLibrary for uint256;

  uint256 public constant BPS = 100;

  IERC677 public immutable linkToken;

  address public immutable vrfCoordinator;

  AggregatorV3Interface public immutable nativeToUsdPriceFeed;
  AggregatorV3Interface public immutable linkToUsdPriceFeed;

  IUniswapV2Router02 public uniV2Router;

  uint256 public nativeInUsdMinToFund = 2.5 * 10 ** 18; // 2.5$

  uint256 public swapSlippagePercentage = 10 * BPS; // 10%

  uint64 public vrfSubscriptionId;

  address[] private _uniV2NativeToLinkSwapPath;

  event Fund(uint256 amountNative, uint256 fundAmount);

  constructor(
    address _ac,
    uint64 _vrfSubscriptionId,
    address _linkToken,
    address _vrfCoordinator,
    address _nativeToUsdPriceFeed,
    address _linkToUsdPriceFeed,
    IUniswapV2Router02 _uniV2Router,
    address[] memory uniV2NativeToLinkSwapPath
  ) RaffleAccessControlMain(_ac) {
    vrfSubscriptionId = _vrfSubscriptionId;

    linkToken = IERC677(_linkToken);

    vrfCoordinator = _vrfCoordinator;

    nativeToUsdPriceFeed = AggregatorV3Interface(_nativeToUsdPriceFeed);
    linkToUsdPriceFeed = AggregatorV3Interface(_linkToUsdPriceFeed);

    uniV2Router = _uniV2Router;
    _uniV2NativeToLinkSwapPath = uniV2NativeToLinkSwapPath;
  }

  function fund() external payable {
    uint256 _amountNative = msg.value;

    uint256 _amountNativeInUsd = _getNativeInUsd(_amountNative);

    require(_amountNativeInUsd >= nativeInUsdMinToFund, "Insufficient funding");

    uint256 _linkReceived = _swapNativeToLink(_amountNative);

    _fundVRFSubscription(_linkReceived);

    emit Fund(_amountNative, _linkReceived);
  }

  function setMinToFundInUsd(uint256 _newVal) external onlyAdmin {
    nativeInUsdMinToFund = _newVal;
  }

  function setSwapPath(address[] memory _newPath) external onlyAdmin {
    delete _uniV2NativeToLinkSwapPath;
    _uniV2NativeToLinkSwapPath = _newPath;
  }

  function setSwapSlippagePercentage(uint256 _newValue) external onlyAdmin {
    swapSlippagePercentage = _newValue;
  }

  function setRouter(IUniswapV2Router02 newRouter) external onlyAdmin {
    uniV2Router = newRouter;
  }

  function setVRFSubscriptionId(uint64 _newValue) external onlyAdmin {
    vrfSubscriptionId = _newValue;
  }

  function getMinRequiredNativeToFund() external view returns (uint256) {
    return (nativeInUsdMinToFund * (10 ** 18)) / _getNativeInUsd(10 ** 18);
  }

  function _swapNativeToLink(uint256 _amountIn) internal returns (uint256) {
    uint256[] memory amounts = uniV2Router.swapExactETHForTokens{value: _amountIn}(
      1,
      _uniV2NativeToLinkSwapPath,
      address(this),
      block.timestamp
    );

    return amounts[amounts.length - 1];
  }

  function _fundVRFSubscription(uint256 _linkAmount) internal {
    if (_linkAmount == 0) return;

    linkToken.transferAndCall(vrfCoordinator, _linkAmount, abi.encode(vrfSubscriptionId));
  }

  function _getUsdToLinkAmount(uint256 _usdAmount) internal view returns (uint256) {
    uint256 linkUsdPrice = _getLinkInUsd(10 ** 18);
    return (_usdAmount * (10 ** 18)) / linkUsdPrice;
  }

  function _calculateAmountOutMin(uint256 _cryptoInUsd) internal view returns (uint256) {
    uint256 linkAmount = _getUsdToLinkAmount(_cryptoInUsd);
    return linkAmount - _calcPercentageFromValue(linkAmount, swapSlippagePercentage);
  }

  function _getNativeInUsd(uint256 _amount) internal view returns (uint256) {
    return (_getBase18Answer(nativeToUsdPriceFeed) * _amount) / 10 ** 18;
  }

  function _getLinkInUsd(uint256 _amount) internal view returns (uint256) {
    return (_getBase18Answer(linkToUsdPriceFeed) * _amount) / 10 ** 18;
  }

  function _getBase18Answer(AggregatorV3Interface priceFeed) internal view returns (uint256) {
    uint256 _priceFeedDecimals = priceFeed.decimals();
    (, int256 _answer, , , ) = priceFeed.latestRoundData();
    return uint256(_answer).convertToBase18(_priceFeedDecimals);
  }

  function _calcPercentageFromValue(uint256 _value, uint256 _percentage) internal pure returns (uint256) {
    return (_value * _percentage) / (100 * BPS);
  }
}
