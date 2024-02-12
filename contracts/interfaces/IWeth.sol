// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2;

interface IWETH {
  function deposit() external payable;

  function withdraw(uint wad) external;

  function balanceOf(address owner) external view returns (uint);

  function transfer(address to, uint value) external returns (bool);

  function approve(address spender, uint value) external returns (bool);
}
