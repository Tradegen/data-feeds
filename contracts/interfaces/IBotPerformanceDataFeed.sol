// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface IBotPerformanceDataFeed {
    struct Order {
        address asset;
        bool isBuy;
        uint256 timestamp;
        uint256 assetPrice;
        uint256 newBotPrice;
    }

    /**
    * @notice Returns the address of this data feed's fee token.
    */
    function feeToken() external view returns (address);

    /**
    * @notice Returns the fee for querying this data feed.
    * @dev Price is based in fee token and is scaled to 18 decimals.
    */
    function usageFee() external view returns (uint256);

    /**
    * @notice Updates the usage fee for this data feed.
    * @dev Only the data feed owner (trading bot owner) can call this function.
    * @dev Assumes that the given fee is scaled to 18 decimals.
    */
    function updateUsageFee(uint256 _newFee) external;

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
     * @notice Adds the order to the ledger and updates the trading bot's token price.
     * @dev This function is meant to be called by the dedicated data provider whenever the bot's keeper
     *          updates entry/exit rules with the latest asset price.
     * @dev Position size is not included because trading bots always use their max buying power for each trade.
     * @param _asset Address of the asset.
     * @param _isBuy Whether the order is a 'buy' order
     * @param _price Price at which the order executed.
     */
    function updateData(address _asset, bool _isBuy, uint256 _price) external;

    /**
    * @notice Updates the address of the data provider allowed to update this data feed.
    * @dev Only the contract operator can call this function.
    * @param _newProvider Address of the new data provider.
    */
    function updateDedicatedDataProvider(address _newProvider) external;

    /**
     * @notice Returns the order info at the given index.
     * @param _index Index of the order.
     * @return (address, bool, uint256, uint256, uint256) Address of the asset, whether the order was a 'buy', timestamp, asset's price, new trading bot token price.
     */
    function getOrderInfo(uint256 _index) external view returns (address, bool, uint256, uint256, uint256);

    /**
     * @notice Returns the current token price of the trading bot.
     * @dev This function can only be called by a user or the BotPerformanceDataFeedRegistry contract.
     * @dev Users calling this function don't need to pay the usage fee.
     * @return (uint256) Price of the trading bot's token, in USD.
     */
    function getTokenPriceExternal() external view returns (uint256);

    /**
     * @notice Returns the current token price of the trading bot.
     * @dev This function can only be called by a contract.
     * @dev Contracts calling this function need to pay the usage fee.
     * @return (uint256) Price of the trading bot's token, in USD.
     */
    function getTokenPriceFromContract() external returns (uint256);
}