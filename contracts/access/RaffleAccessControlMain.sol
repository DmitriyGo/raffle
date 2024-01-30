// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {RaffleAccessControl} from "./RaffleAccessControl.sol";

error RaffleAccessControlMain__NoRole();

abstract contract RaffleAccessControlMain {
  RaffleAccessControl public immutable ac;

  constructor(address _ac) {
    ac = RaffleAccessControl(_ac);
  }

  modifier onlyRole(bytes32 role) {
    if (!ac.hasRole(role, msg.sender)) revert RaffleAccessControlMain__NoRole();
    _;
  }

  modifier onlyAdmin() {
    if (!ac.hasRole(ac.DEFAULT_ADMIN_ROLE(), msg.sender)) revert RaffleAccessControlMain__NoRole();
    _;
  }
}
