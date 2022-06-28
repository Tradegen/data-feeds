// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface IVTEDataFeed {
    struct Order {
        string asset;
        bool isBuy;
        bool isLong;
        uint256 timestamp;
        uint256 assetPrice;
        uint256 leverageFactor;
        uint256 portfolioValue;
    }

    struct Position {
        string asset;
        bool isLong;
        uint256 entryPrice;
        uint256 leverageFactor;
        uint256 portfolioValue;
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
    * @dev Only the data feed owner (VTE owner) can call this function.
    * @dev Assumes that the given fee is scaled to 18 decimals.
    */
    function updateUsageFee(uint256 _newFee) external;

    /**
    * @notice Returns the timestamp at which the data feed was last updated.
    */
    function lastUpdated() external view returns (uint256);

    /**
    * @notice Returns the status of this data feed.
    * @dev 0 = Active.
    * @dev 1 = Outdated.
    * @dev 2 = Halted.
    */
    function getDataFeedStatus() external view returns (uint256);

    /**
    * @notice Returns the timestamp at which the update at the given index was made.
    * @param _index Index in this data feed's history of updates.
    * @return uint256 Timestamp at which the update was made.
    */
    function getIndexTimestamp(uint256 _index) external view returns (uint256);

    /**
    * @notice Returns the timestamp at which this data feed was created.
    */
    function createdOn() external view returns (uint256);

    /**
    * @notice Returns the address of this data feed's data provider.
    */
    function dataProvider() external view returns (address);

    /**
     * @notice Adds the order to the ledger and updates the VTE's token price.
     * @dev This function is meant to be called by the dedicated data provider whenever the VTE owner
     *      makes a trade.
     * @param _asset Symbol of the asset.
     * @param _isBuy Whether the order is a 'buy' order.
     * @param _isLong Whether the order is long or short.
     * @param _price Price at which the order executed.
     * @param _leverageFactor Amount of leverage used.
     * @param _timestamp Timestamp when the order was executed.
     */
    function updateData(string memory _asset, bool _isBuy, bool _isLong, uint256 _price, uint256 _leverageFactor, uint256 _timestamp) external;

    /**
    * @notice Updates the address of the data provider allowed to update this data feed.
    * @dev Only the contract operator can call this function.
    * @param _newProvider Address of the new data provider.
    */
    function updateDedicatedDataProvider(address _newProvider) external;

    /**
     * @notice Returns the order info at the given index.
     * @param _index Index of the order.
     * @return (address, bool, bool, uint256, uint256, uint256) Symbol of the asset, whether the order was a 'buy', whether the order was long or short, timestamp, asset's price, and the leverage factor.
     */
    function getOrderInfo(uint256 _index) external view returns (string memory, bool, bool, uint256, uint256, uint256);

    /**
     * @notice Returns the current token price of the VTE.
     * @dev Contracts calling this function need to pay the usage fee.
     * @return (uint256) Price of the VTE's token, in USD.
     */
    function getTokenPrice() external returns (uint256);

    /**
    * @notice Updates the operator of this contract.
    * @dev Only the contract owner can call this function.
    * @param _newOperator Address of the new operator.
    */
    function setOperator(address _newOperator) external;
}