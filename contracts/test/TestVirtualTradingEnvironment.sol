// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

contract TestVirtualTradingEnvironment {
    address public user;

    constructor(address _owner) {
        user = _owner;
    }

    function setOwner(address _owner) external  {
        user = _owner;
    }

    function VTEOwner() external view returns (address) {
        return user;
    }
}