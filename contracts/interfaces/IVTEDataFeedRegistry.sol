// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface IVTEDataFeedRegistry {
    /**
    * @notice Returns the address of the given VTE's data feed's fee token.
    * @dev Returns address(0) if the given VTE does not have a data feed.
    * @param _VTE Address of the virtual trading environment.
    * @return address Address of the data feed's fee token.
    */
    function usageFeeToken(address _VTE) external view returns (address);

    /**
    * @notice Returns the fee for querying the given VTE's data feed.
    * @dev Price is based in fee token and is scaled to 18 decimals.
    * @dev Returns 0 if the given VTE does not have a data feed.
    */
    function usageFee(address _VTE) external view returns (uint256);

    /**
    * @notice Given the address of a VTE, returns the VTE's data feed info.
    * @dev Returns 0 or address(0) for each value if the given VTE does not have a data feed.
    * @param _VTE Address of the VTE.
    * @return (address, address, address, address, uint256) Address of the data feed, address of the data feed's VTE, address of the VTE owner, address of the dedicated data provider, usage fee.
    */
    function getDataFeedInfo(address _VTE) external view returns (address, address, address, address, uint256);

    /**
    * @notice Returns the timestamp at which the given VTE's data feed was last updated.
    * @dev Returns 0 if the given VTE does not have a data feed.
    * @param _VTE Address of the virtual trading environment.
    */
    function lastUpdated(address _VTE) external view returns (uint256);

    /**
     * @notice Returns the order info for the given VTE at the given index.
     * @dev Returns 0 for each value if the VTE does not have a data feed or the given index is out of bounds.
     * @param _VTE Address of the virtual trading environment.
     * @param _index Index of the order.
     * @return (string, bool, bool, uint256, uint256, uint256) Symbol of the asset, whether the order was a 'buy', timestamp, asset's price, and leverage factor.
     */
    function getOrderInfo(address _VTE, uint256 _index) external view returns (string memory, bool, uint256, uint256, uint256);

    /**
     * @notice Returns the current token price of the given VTE.
     * @dev Contracts calling this function need to pay the usage fee.
     * @dev Returns 0 if the given VTE does not have a data feed.
     * @dev Assumes that feeToken.approve(Registry contract address, usage fee) has been called externally.
     * @param _VTE Address of the virtual trading environment.
     * @return (uint256) Price of the VTE's token, in USD.
     */
    function getTokenPrice(address _VTE) external returns (uint256);

    /**
    * @notice Registers a new data feed to the platform.
    * @dev Only the contract operator can call this function.
    * @dev Transaction will revert if a data feed already exists for the given VTE.
    * @param _VTE Address of the virtual trading environment.
    * @param _usageFee Number of fee tokens to charge whenever a contract queries the data feed.
    * @param _dedicatedDataProvider Address of the data provider responsible for this data feed.
    */
    function registerDataFeed(address _VTE, uint256 _usageFee, address _dedicatedDataProvider) external;
}