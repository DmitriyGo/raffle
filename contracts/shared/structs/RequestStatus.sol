// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

struct RequestStatus {
    bool fulfilled;
    bool exists;
    address callbackAddress;
    bytes4 callbackFuncSelector;
    bytes callbackData;
}
