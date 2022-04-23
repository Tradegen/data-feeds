// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface IBotPerformanceDataFeed {
    struct BotPerformanceDataFeed {
        address dataFeedAddress;
        address tradingBotAddress;
        address tradingBotOwner;
        address dedicatedDataProvider;
        uint256 usageFee;
    }

    /**
    * @notice Returns the address of the given trading bot's data feed's fee token.
    * @dev Returns address(0) if the given trading bot does not have a data feed.
    * @param _tradingBot Address of the trading bot.
    * @return address Address of the data feed's fee token.
    */
    function feeToken(address _tradingBot) external view returns (address);

    /**
    * @notice Returns the fee for querying the given trading bot's data feed.
    * @dev Price is based in fee token and is scaled to 18 decimals.
    * @dev Returns 0 if the given trading bot does not have a data feed.
    */
    function usageFee(address _tradingBot) external view returns (uint256);

    /**
    * @notice Given the address of a trading bot, returns the trading bot's data feed info.
    * @dev Returns 0 or address(0) for each value if the given trading bot does not have a data feed.
    * @param _tradingBot Address of the trading bot.
    * @return (address, address, address, address, uint256) Address of the data feed, address of the data feed's trading bot, address of the trading bot owner, address of the dedicated data provider, usage fee.
    */
    function getDataFeedInfo(address _tradingBot) external view returns (address, address, address, address, uint256);

    /**
    * @notice Given the address of a trading bot, returns the address of the trading bot's data feed.
    * @dev Returns address(0) if the given trading bot does not have a data feed.
    * @param _tradingBot Address of the trading bot.
    * @return address Address of the data feed.
    */
    function getDataFeedAddress(address _tradingBot) external view returns (address);

    /**
    * @notice Returns the timestamp at which the given trading bot's data feed was last updated.
    * @dev Returns 0 if the given trading bot does not have a data feed.
    * @param _tradingBot Address of the trading bot.
    */
    function lastUpdated(address _tradingBot) external view returns (uint256);

    /**
     * @notice Returns the order info for the given trading bot at the given index.
     * @dev Returns 0 for each value if the trading bot does not have a data feed or the given index is out of bounds.
     * @param _tradingBot Address of the trading bot.
     * @param _index Index of the order.
     * @return (address, bool, uint256, uint256, uint256) Address of the asset, whether the order was a 'buy', timestamp, asset's price, new trading bot token price.
     */
    function getOrderInfo(address _tradingBot, uint256 _index) external view returns (address, bool, uint256, uint256, uint256);

    /**
     * @notice Returns the current token price of the given trading bot.
     * @dev This function can only be called by a user.
     * @dev Users calling this function don't need to pay the usage fee.
     * @dev Returns 0 if the given trading bot does not have a data feed.
     * @param _tradingBot Address of the trading bot.
     * @return (uint256) Price of the trading bot's token, in USD.
     */
    function getTokenPriceExternal(address _tradingBot) external view returns (uint256);

    /**
     * @notice Returns the current token price of the given trading bot.
     * @dev This function can only be called by a contract.
     * @dev Contracts calling this function need to pay the usage fee.
     * @dev Returns 0 if the given trading bot does not have a data feed.
     * @dev Assumes that feeToken.approve(Registry contract address, usage fee) has been called externally.
     * @param _tradingBot Address of the trading bot.
     * @return (uint256) Price of the trading bot's token, in USD.
     */
    function getTokenPriceFromContract(address _tradingBot) external returns (uint256);

    /**
    * @notice Registers a new data feed to the platform.
    * @dev Only the contract operator can call this function.
    * @dev Transaction will revert if a data feed already exists for the given trading bot.
    * @param _tradingBot Address of the trading bot.
    * @param _owner Address of the trading bot's owner.
    * @param _usageFee Number of fee tokens to charge whenever a contract queries the data feed.
    * @param _dedicatedDataProvider Address of the data provider responsible for this data feed.
    */
    function registerDataFeed(address _tradingBot, address _owner, uint256 _usageFee, address _dedicatedDataProvider) external;
}