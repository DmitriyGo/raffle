// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock.sol";

error VRFCoordinatorMock__InvalidCalldataLength(uint expectedLength, uint actualLength);

contract VRFCoordinatorMock is VRFCoordinatorV2Mock {
  constructor(uint96 _baseFee, uint96 _gasPriceLink) VRFCoordinatorV2Mock(_baseFee, _gasPriceLink) {}

  function onTokenTransfer(address /* sender */, uint256 amount, bytes calldata data) external {
    if (data.length != 32) {
      revert VRFCoordinatorMock__InvalidCalldataLength(32, data.length);
    }
    uint64 subId = abi.decode(data[:32], (uint64));
    fundSubscription(subId, uint96(amount));
  }
}
