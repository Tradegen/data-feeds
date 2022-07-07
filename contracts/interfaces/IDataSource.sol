// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface IDataSource {
    /**
    * @notice Returns the latest price of the given asset.
    * @dev Calls the data feed associated with the asset to get the price.
    * @dev If the data feed does not exist, returns 0.
    * @param _asset Symbol of the asset.
    * @return uint256 Latest price of the asset.
    */
    function getLatestPrice(string memory _asset) external view returns (uint256);
}