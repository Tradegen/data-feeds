// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Inheritance.
import '../interfaces/ITradingBot.sol';

contract TestTradingBot is ITradingBot {
    address public override owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function setOwner(address _owner) external  {
        owner = _owner;
    }
}