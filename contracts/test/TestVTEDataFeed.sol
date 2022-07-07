// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "../VTEDataFeed.sol";

contract TestVTEDataFeed is VTEDataFeed {
    constructor(address _dataProvider, address _operator, address _feePool, address _oracle, address _VTE, address _feeToken, uint256 _usageFee)
        VTEDataFeed(_dataProvider, _operator, _feePool, _oracle, _VTE, _feeToken, _usageFee)
    {
    }

    function calculateCurrentValues(string memory _asset) external view returns (Params memory params) {
        return _calculateCurrentValues(_asset);
    }

    function calculateTokenPrice(uint256 _positiveCurrentValue, uint256 _negativeCurrentValue) external view returns (uint256) {
        return _calculateTokenPrice(_positiveCurrentValue, _negativeCurrentValue);
    }

    function updatePositions(string memory _asset, bool _isBuy, uint256 _price, uint256 _leverageFactor) external {
        _updatePositions(_asset, _isBuy, _price, _leverageFactor);
    }

    function setPosition(uint256 _index, bool _isLong, uint256 _entryPrice, uint256 _leverageFactor, string memory _asset) external {
        positions[_index] = Position({
            isLong: _isLong,
            entryPrice: _entryPrice,
            leverageFactor: _leverageFactor,
            asset: _asset
        });
    }

    function setNumberOfUpdates(uint256 _amount) external {
        numberOfUpdates = _amount;
    }

    function setNumberOfPositions(uint256 _amount) external {
        numberOfPositions = _amount;
    }

    function setLatestPortfolioValue(uint256 _amount) external {
        latestPortfolioValue = _amount;
    }
}