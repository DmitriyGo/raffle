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

import "hardhat/console.sol";

error Raffle__SendMoreToEnterRaffle();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 playersCount, uint256 raffleState);

contract Raffle is RaffleAccessControlMain, VRFConsumerBaseV2, AutomationCompatibleInterface {
  using SafeERC20 for IERC20;

  uint32 public constant VRF_CALLBACK_GAS_LIMIT = 2_500_000;
  uint32 private constant NUM_WORDS = 3;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;

  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  ChainlinkFunder public immutable i_chainLinkFunder;

  bytes32 private immutable i_vrfKeyHash;
  uint64 private immutable i_subscriptionId;
  uint256 public immutable i_interval;
  uint256 public s_lastTimeStamp;

  address private s_recentWinner;
  RaffleState private s_raffleState;

  mapping(address => bool) public s_isTokenAllowed;
  mapping(address => address) public s_tokenPriceFeedMapping;

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
    uint64 _subscriptionId,
    bytes32 _vrfKeyHash,
    uint256 _interval,
    address[] memory allowedTokens
  ) RaffleAccessControlMain(_ac) VRFConsumerBaseV2(_vrfCoordinatorV2) {
    i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
    i_chainLinkFunder = ChainlinkFunder(_chainLinkFunder);

    i_vrfKeyHash = _vrfKeyHash;
    i_subscriptionId = _subscriptionId;
    i_interval = _interval;

    for (uint256 i = 0; i < allowedTokens.length; i++) {
      s_isTokenAllowed[allowedTokens[i]] = true;
    }

    s_raffleState = RaffleState.OPEN;
  }

  function playGame(address token, uint256 betAmount, bytes memory data) external payable coverChainLinkExpenses {}

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
    uint256 indexOwWinner = randomWords[0] % s_players.length;
    address payable recentWinner = s_players[indexOwWinner];
    s_recentWinner = recentWinner;
    s_players = new address payable[](0);
    s_raffleState = RaffleState.OPEN;
    s_lastTimeStamp = block.timestamp;
    (bool success, ) = recentWinner.call{value: address(this).balance}("");
    if (!success) {
      revert Raffle__TransferFailed();
    }
    emit WinnerPicked(recentWinner);
  }

  function setTokenPriceFeed(address token, address priceFeed) external onlyAdmin {
    s_tokenPriceFeedMapping[token] = priceFeed;
  }

  function getTokenPrice(address token) public view returns (int) {
    AggregatorV3Interface priceFeed = AggregatorV3Interface(s_tokenPriceFeedMapping[token]);
    (, int price, , , ) = priceFeed.latestRoundData();
    return price;
  }
}
