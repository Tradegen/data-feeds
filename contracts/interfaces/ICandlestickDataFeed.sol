// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface ICandlestickDataFeed {
    struct Candlestick {
        uint256 index;
        uint256 high;
        uint256 low;
        uint256 open;
        uint256 close;
        uint256 volume;
        uint256 startingTimestamp;
    }

    /**
    * @notice Gets the current price of the data feed's asset.
    * @dev Current price is the 'close' price of the latest candlestick.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @return uint256 The current USD price.
    */
    function getCurrentPrice() external view returns (uint256);

    /**
    * @notice Gets the price of the data feed's asset at the given index.
    * @dev Index must come before the current index.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @param _index Index in the data feed's history.
    * @return uint256 The USD price at the given index.
    */
    function getPriceAt(uint256 _index) external view returns (uint256);

    /**
    * @notice Gets the current candlestick of the data feed's asset.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256, uint256) The candlestick index, high price, low price, open price, close price, volume, and starting timestamp.
    */
    function getCurrentCandlestick() external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256);

    /**
    * @notice Gets the candlestick of the data feed's asset at the given index.
    * @dev Index must come before the current index.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @param _index Index in the data feed's history.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256, uint256) The candlestick index, high price, low price, open price, close price, volume, and starting timestamp.
    */
    function getCandlestickAt(uint256 _index) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256);

    /**
    * @notice Returns the timestamp at which the data feed was last updated.
    */
    function lastUpdated() external view returns (uint256);

    /**
    * @notice Returns the timestamp at which the update at the given index was made.
    * @param _index Index in this data feed's history of updates.
    * @return uint256 Timestamp at which the update was made.
    */
    function getIndexTimestamp(uint256 _index) external view returns (uint256);

    /**
    * @notice Returns the status of this data feed.
    */
    function getDataFeedStatus() external view returns (uint256);

    /**
    * @notice Aggregates the given number of candlesticks into one candlestick, representing a higher timeframe.
    * @dev If there are not enough candlesticks in the data feed's history, the function will aggregate all candlesticks in the data feed's history.
    *      Ex) If user wants to aggregate 60 candlesticks but the data feed only has 50 candlesticks, the function will return a candlestick of size 50 instead of 60.
    * @dev It is not recommended to aggregate more than 10 candlesticks due to gas.
    * @param _numberOfCandlesticks Number of candlesticks to aggregate.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256) High price, low price, open price, close price, total volume, and starting timestamp.
    */
    function aggregateCandleSticks(uint256 _numberOfCandlesticks) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);

    /**
    * @notice Updates the data feed's latest candlestick data with the given data.
    * @dev This function can only be called by the dedicated data provider.
    * @dev Data is based on a 1-minute timeframe.
    * @dev Data is scaled to 18 decimals.
    * @param _high High price for the data feed's asset.
    * @param _low Low price for the data feed's asset.
    * @param _open Starting price for the data feed's asset.
    * @param _close Ending price for the data feed's asset. 
    * @param _volume Number of tokens traded over the last minute.
    * @param _startingTimestamp Timestamp at the start of the candlestick.
    */
    function updateData(uint256 _high, uint256 _low, uint256 _open, uint256 _close, uint256 _volume, uint256 _startingTimestamp) external;

    /**
    * @notice Updates the address of the data provider allowed to update this data feed.
    * @dev Only the contract operator can call this function.
    * @param _newProvider Address of the new data provider.
    */
    function updateDedicatedDataProvider(address _newProvider) external;
}