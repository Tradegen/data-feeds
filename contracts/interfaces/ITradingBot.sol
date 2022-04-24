// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface ITradingBot {
    /**
    * @notice Returns the address of the trading bot's owner.
    */
    function owner() external view returns (address);
}