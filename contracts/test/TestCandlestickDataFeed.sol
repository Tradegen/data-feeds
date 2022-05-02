// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Inheritance.
import '../CandlestickDataFeed.sol';

contract TestCandlestickDataFeed is CandlestickDataFeed {
    constructor(uint256 _timeframe, address _dataProvider, address _operator, string memory _symbol) CandlestickDataFeed(_timeframe, _dataProvider, _operator, _symbol) {}

    function setLastUpdated(uint256 _lastUpdated) external  {
        lastUpdated = _lastUpdated;
    }

    function getCurrentTime() external view returns (uint256) {
        return block.timestamp;
    }
}