// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface IOracle {
    /**
    * @notice Returns the latest price of the given asset.
    * @dev Calls the current data source to get the price.
    * @param _asset Symbol of the asset.
    * @return uint256 Latest price of the asset.
    */
    function getLatestPrice(string memory _asset) external view returns (uint256);

    /**
    * @notice Returns the address of the oracle contract's data source.
    */
    function dataSource() external view returns (address);
}