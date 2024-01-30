// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

import {RaffleAccessControlMain} from "../access/RaffleAccessControlMain.sol";

import {IRaffleVRF} from "../interfaces/IRaffleVRF.sol";

import {RequestStatus} from "../shared/structs/RequestStatus.sol";

contract RaffleVRF is VRFConsumerBaseV2, RaffleAccessControlMain, IRaffleVRF {
  uint16 public constant REQUEST_CONFIRMATIONS = 3;
  uint32 public constant VRF_CALLBACK_GAS_LIMIT = 2_500_000;

  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

  bytes32 public immutable i_vrfKeyHash;
  uint64 private _subscriptionId;

  mapping(uint256 => RequestStatus) public vrfRequests;

  event RequestSent(uint256 requestId, uint32 numWords);
  event RequestFulfilled(uint256 requestId);

  constructor(
    address _ac,
    address _vrfCoordinator,
    uint64 subscriptionId,
    bytes32 _vrfKeyHash
  ) RaffleAccessControlMain(_ac) VRFConsumerBaseV2(_vrfCoordinator) {
    _subscriptionId = subscriptionId;
    i_vrfKeyHash = _vrfKeyHash;
    i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
  }

  function requestRandomWords(
    uint32 numWords,
    address callbackAddress,
    bytes4 callbackFuncSelector,
    bytes memory callbackData
  ) external onlyRole(ac.VRF_REQUESTER_ROLE()) returns (uint256 requestId) {
    requestId = i_vrfCoordinator.requestRandomWords(
      i_vrfKeyHash,
      _subscriptionId,
      REQUEST_CONFIRMATIONS,
      VRF_CALLBACK_GAS_LIMIT,
      numWords
    );

    vrfRequests[requestId] = RequestStatus({
      callbackData: callbackData,
      exists: true,
      callbackAddress: callbackAddress,
      callbackFuncSelector: callbackFuncSelector,
      fulfilled: false
    });

    return requestId;
  }

  function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
    RequestStatus memory status = vrfRequests[_requestId];
    require(status.exists, "VRF: request not found");
    require(!status.fulfilled, "VRF: already filled");

    status.fulfilled = true;

    (bool success, ) = status.callbackAddress.call(
      abi.encodeWithSelector(status.callbackFuncSelector, _requestId, _randomWords, status.callbackData)
    );

    assert(success);

    vrfRequests[_requestId] = status;

    emit RequestFulfilled(_requestId);
  }

  function getRequestStatus(uint256 _requestId) external view returns (RequestStatus memory) {
    require(vrfRequests[_requestId].exists, "request not found");

    return vrfRequests[_requestId];
  }

  function changeSubId(uint64 newSubId) public onlyRole(ac.DEFAULT_ADMIN_ROLE()) {
    _subscriptionId = newSubId;
  }
}
