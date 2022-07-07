// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// OpenZeppelin.
import "../openzeppelin-solidity/contracts/Ownable.sol";

// Interfaces.
import '../interfaces/IDataSource.sol';

// Inheritance.
import '../interfaces/IOracle.sol';

contract Oracle is IOracle, Ownable {
    address public override dataSource;

    constructor(address _dataSource) Ownable() {
        dataSource = _dataSource;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the latest price of the given asset.
    * @dev Calls the current data source to get the price.
    * @param _asset Symbol of the asset.
    * @return uint256 Latest price of the asset.
    */
    function getLatestPrice(string memory _asset) external view override returns (uint256) {
        return IDataSource(dataSource).getLatestPrice(_asset);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Updates the address of the data source.
    * @dev This function can only be called by the Oracle contract owner.
    * @param _dataSource Address of the DataSource contract.
    */
    function setDataSource(address _dataSource) external onlyOwner {
        dataSource = _dataSource;

        emit SetDataSource(_dataSource);
    }

    /* ========== EVENTS ========== */

    event SetDataSource(address newDataSource);
}