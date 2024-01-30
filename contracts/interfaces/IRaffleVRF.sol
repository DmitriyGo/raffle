// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {RequestStatus} from "../shared/structs/RequestStatus.sol";

interface IRaffleVRF {
  function requestRandomWords(
    uint32 numWords,
    address callbackAddress,
    bytes4 callbackFuncSelector,
    bytes memory callbackData
  ) external returns (uint256 requestId);

  function getRequestStatus(uint256 _requestId) external view returns (RequestStatus memory);
}
