// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract RaffleAccessControl is AccessControl {
  bytes32 public constant VIP_MANAGER_ROLE = keccak256("VIP_MANAGER_ROLE");
  bytes32 public constant VRF_REQUESTER_ROLE = keccak256("VRF_REQUESTER_ROLE");
  bytes32 public constant VRF_FULFILLER_ROLE = keccak256("VRF_FULFILLER_ROLE");

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(VIP_MANAGER_ROLE, msg.sender);
  }
}
