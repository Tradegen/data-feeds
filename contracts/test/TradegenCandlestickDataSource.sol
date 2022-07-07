// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// OpenZeppelin.
import "../openzeppelin-solidity/contracts/Ownable.sol";

// Interfaces.
import '../interfaces/ICandlestickDataFeedRegistry.sol';

// Inheritance.
import '../interfaces/IDataSource.sol';

contract TradegenCandlestickDataSource is IDataSource, Ownable {
    ICandlestickDataFeedRegistry public registry;

    constructor(address _registry) Ownable() {
        registry = ICandlestickDataFeedRegistry(_registry);
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the latest price of the given asset.
    * @dev Calls the data feed associated with the asset to get the price.
    * @dev If the data feed does not exist, returns 0.
    * @param _asset Symbol of the asset.
    * @return uint256 Latest price of the asset.
    */
    function getLatestPrice(string memory _asset) external view override returns (uint256) {
        return registry.getCurrentPrice(_asset, 1);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Updates the address of the registry.
    * @dev This function can only be called by the DataSource contract owner.
    * @param _registry Address of the CandlestickDataFeedRegistry contract.
    */
    function setRegistry(address _registry) external onlyOwner {
        registry = ICandlestickDataFeedRegistry(_registry);

        emit SetRegistry(_registry);
    }

    /* ========== EVENTS ========== */

    event SetRegistry(address newRegistry);
}