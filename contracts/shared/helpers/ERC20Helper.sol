// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library ERC20Helper {
  using SafeERC20 for IERC20;

  function approveIfNeeded(IERC20 _token, address _spender, uint256 _amount) internal {
    uint256 currentAllowance = _token.allowance(address(this), _spender);
    if (currentAllowance < _amount) {
      _token.forceApprove(_spender, _amount);
    }
  }

  function approveIfNeeded(IERC20 _token, address _spender) internal {
    approveIfNeeded(_token, _spender, type(uint256).max);
  }
}
