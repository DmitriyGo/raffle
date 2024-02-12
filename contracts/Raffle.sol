// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

import {ChainlinkFunder} from "./vrf/ChainlinkFunder.sol";
import {RaffleState} from "./shared/enums/RaffleState.sol";
import {RaffleAccessControlMain} from "./access/RaffleAccessControlMain.sol";

import "./interfaces/IWeth.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./libraries/DecimalCorrectionLibrary.sol";

import "hardhat/console.sol";

error Raffle__NotAllowedToken(address token);
error Raffle__MinBetSizeExceeded();
error Raffle__MaxBetSizeExceeded();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 playersCount, uint256 raffleState);

contract Raffle is RaffleAccessControlMain, VRFConsumerBaseV2, AutomationCompatibleInterface {
  using SafeERC20 for IERC20;
  using DecimalCorrectionLibrary for uint256;

  uint32 public constant VRF_CALLBACK_GAS_LIMIT = 2_500_000;
  uint32 private constant NUM_WORDS = 3;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;

  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  ChainlinkFunder public immutable i_chainLinkFunder;
  IWETH public immutable i_weth;
  IUniswapV2Router02 public s_uniV2Router;

  bytes32 private immutable i_vrfKeyHash;
  uint64 private immutable i_subscriptionId;
  uint256 public immutable i_interval;
  uint256 public s_lastTimeStamp;

  RaffleState private s_raffleState;
  address private s_recentWinner;
  uint256 private s_minBetSize;
  uint256 private s_maxBetSize;
  uint256 private s_totalBets;

  mapping(address => uint256) private s_playerBets;
  mapping(address => bool) public s_isTokenAllowed;
  mapping(address => address) public s_tokenUsdPriceFeeds;
  mapping(address => address) public s_tokenEthPriceFeeds;

  address payable[] private s_players;

  event RaffleEntered(address indexed player);
  event RequestedRaffleWinner(uint256 indexed requestId);
  event WinnerPicked(address indexed winner);

  modifier coverChainLinkExpenses() {
    i_chainLinkFunder.fund{value: msg.value}();
    _;
  }

  constructor(
    address _ac,
    address _vrfCoordinatorV2,
    address _chainLinkFunder,
    IUniswapV2Router02 _uniV2Router,
    address _wethAddress,
    uint64 _subscriptionId,
    bytes32 _vrfKeyHash,
    uint256 _interval,
    uint256 _minBetSize,
    uint256 _maxBetSize,
    address[] memory allowedTokens
  ) RaffleAccessControlMain(_ac) VRFConsumerBaseV2(_vrfCoordinatorV2) {
    i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
    i_chainLinkFunder = ChainlinkFunder(_chainLinkFunder);
    i_weth = IWETH(_wethAddress);
    s_uniV2Router = _uniV2Router;

    i_vrfKeyHash = _vrfKeyHash;
    i_subscriptionId = _subscriptionId;
    i_interval = _interval;
    s_minBetSize = _minBetSize;
    s_maxBetSize = _maxBetSize;

    for (uint256 i = 0; i < allowedTokens.length; i++) {
      s_isTokenAllowed[allowedTokens[i]] = true;
    }

    s_raffleState = RaffleState.OPEN;
  }

  function enterRaffle(address token, uint256 betAmount) public payable {
    if (s_raffleState != RaffleState.OPEN) {
      revert Raffle__NotOpen();
    }

    if (!s_isTokenAllowed[token]) {
      revert Raffle__NotAllowedToken(token);
    }

    uint256 betInUsd = _getTokenInUsd(token, betAmount);
    console.log("betInUsd", betInUsd);

    if (betInUsd < s_minBetSize) {
      revert Raffle__MinBetSizeExceeded();
    }

    uint256 userTotalBet = s_playerBets[msg.sender] + betInUsd;

    if (userTotalBet > s_maxBetSize) {
      revert Raffle__MaxBetSizeExceeded();
    }

    s_playerBets[msg.sender] = userTotalBet;
    s_totalBets += betInUsd;
    s_players.push(payable(msg.sender));

    IERC20(token).safeTransferFrom(msg.sender, address(this), betAmount);
    IERC20(token).approve(address(s_uniV2Router), betAmount);

    address[] memory path = new address[](2);
    path[0] = token;
    path[1] = address(s_uniV2Router.WETH());

    // TODO: add mapping token -> weth dataFeed and use priceAggregator

    console.log("swap");

    uint[] memory amounts = s_uniV2Router.swapExactTokensForTokens(
      betAmount,
      0, // TODO
      path,
      address(this),
      block.timestamp
    );

    for (uint256 i = 0; i < amounts.length; i++) {
      console.log(i, amounts[i]);
    }

    console.log(i_weth.balanceOf(address(this)));

    emit RaffleEntered(msg.sender);
  }

  function checkUpkeep(
    bytes memory /* checkData */
  ) public view override returns (bool upkeepNeeded, bytes memory /* performData */) {
    bool isOpen = s_raffleState == RaffleState.OPEN;
    bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
    bool hasPlayers = s_players.length > 0;
    bool hasBalance = address(this).balance > 0;

    upkeepNeeded = isOpen && timePassed && hasPlayers && hasBalance;
  }

  function performUpkeep(bytes calldata /* performData */) external override {
    (bool upkeepNeeded, ) = checkUpkeep("");

    if (!upkeepNeeded) {
      revert Raffle__UpkeepNotNeeded({
        currentBalance: address(this).balance,
        playersCount: s_players.length,
        raffleState: uint256(s_raffleState)
      });
    }

    s_raffleState = RaffleState.CALCULATING;
    uint256 requestId = i_vrfCoordinator.requestRandomWords(
      i_vrfKeyHash,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      VRF_CALLBACK_GAS_LIMIT,
      NUM_WORDS
    );

    emit RequestedRaffleWinner(requestId);
  }

  function fulfillRandomWords(uint256 /*requestId*/, uint256[] memory randomWords) internal override {
    uint256 totalBets = s_totalBets;
    uint256 winningBet = randomWords[0] % totalBets;
    uint256 cumulativeBet = 0;
    address payable winner;

    for (uint256 i = 0; i < s_players.length; i++) {
      address payable playerAddress = s_players[i];
      cumulativeBet += s_playerBets[playerAddress];
      if (cumulativeBet >= winningBet) {
        winner = playerAddress;
        break;
      }
    }

    require(winner != address(0), "No winner determined");

    s_recentWinner = winner;
    s_raffleState = RaffleState.OPEN;
    s_lastTimeStamp = block.timestamp;

    uint256 prizeAmount = i_weth.balanceOf(address(this));
    i_weth.withdraw(prizeAmount);
    (bool success, ) = winner.call{value: prizeAmount}("");
    require(success, "Failed to send ETH to the winner");

    for (uint256 i = 0; i < s_players.length; i++) {
      s_playerBets[s_players[i]] = 0;
    }
    s_players = new address payable[](0);
    s_totalBets = 0;

    emit WinnerPicked(winner);
  }

  function getTokenPrice(address token) public view returns (int) {
    AggregatorV3Interface priceFeed = AggregatorV3Interface(s_tokenUsdPriceFeeds[token]);
    (, int price, , , ) = priceFeed.latestRoundData();
    return price;
  }

  function setTokenPriceFeed(address token, address priceFeed) external onlyAdmin {
    s_tokenUsdPriceFeeds[token] = priceFeed;
  }

  function setRouter(IUniswapV2Router02 newRouter) external onlyAdmin {
    s_uniV2Router = newRouter;
  }

  function _getWethInUsd(uint256 amount) internal view returns (uint256) {
    AggregatorV3Interface priceFeedWETH = AggregatorV3Interface(s_tokenUsdPriceFeeds[address(i_weth)]);

    uint256 tokenPriceInETH = _getBase18Answer(priceFeedWETH);
    uint256 amountInETH = (tokenPriceInETH * amount) / 10 ** 18;

    // Assuming 1 WETH = 1 ETH for simplicity, otherwise use priceFeedWETH for conversion if needed
    return amountInETH;
  }

  function _getTokenInUsd(address token, uint256 amount) internal view returns (uint256) {
    AggregatorV3Interface priceFeed = AggregatorV3Interface(s_tokenUsdPriceFeeds[token]);
    return (_getBase18Answer(priceFeed) * amount) / 10 ** 18;
  }

  function _getBase18Answer(AggregatorV3Interface priceFeed) internal view returns (uint256) {
    uint256 _priceFeedDecimals = priceFeed.decimals();
    (, int256 _answer, , , ) = priceFeed.latestRoundData();
    console.log("_answer:");
    console.logInt(_answer);
    return uint256(_answer).convertToBase18(_priceFeedDecimals);
  }
}
