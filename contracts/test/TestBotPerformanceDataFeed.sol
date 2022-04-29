// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Inheritance.
import '../BotPerformanceDataFeed.sol';

contract TestBotPerformanceDataFeed is BotPerformanceDataFeed {
    constructor(address _dataProvider, address _operator, address _feePool, address _candlestickDataFeedRegistry, address _tradingBot, address _feeToken, uint256 _usageFee)
        BotPerformanceDataFeed(_dataProvider, _operator, _feePool, _candlestickDataFeedRegistry, _tradingBot, _feeToken, _usageFee) {}

    function setLastUpdated(uint256 _lastUpdated) external  {
        lastUpdated = _lastUpdated;
    }

    function getCurrentTime() external view returns (uint256) {
        return block.timestamp;
    }

    function calculateTokenPrice() external view returns (uint256) {
        return _calculateTokenPrice();
    }

    function setOrder(uint256 _index, string memory _asset, bool _isBuy, uint256 _timestamp, uint256 _assetPrice, uint256 _botPrice) external {
        orders[_index] = Order({
            asset: _asset,
            isBuy: _isBuy,
            timestamp: _timestamp,
            assetPrice: _assetPrice,
            newBotPrice: _botPrice
        });
    }

    function setNumberOfUpdates(uint256 _numberOfUpdates) external {
        numberOfUpdates = _numberOfUpdates;
    }
}