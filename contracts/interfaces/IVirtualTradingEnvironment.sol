// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IVirtualTradingEnvironment {

    struct Position {
        bool isLong;
        uint256 leverageFactor;
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Returns the address of the VTE's owner.
     */
    function VTEOwner() external view returns (address);

    /**
     * @notice Returns the address of the VTE's VirtualTradingEnvironmentDataFeed contract.
     */
    function dataFeed() external view returns (address);

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Simulates a market order for the given asset.
    * @dev This function can only be called by the VTE owner.
    * @dev Transaction will revert if adding the given leverage factor exceeds the max leverage factor.
    * @param _asset Symbol of the asset.
    * @param _isBuy Whether the order represents a 'buy' order.
    * @param _leverageFactor Amount of leverage to use; denominated by 100.
    *                        Ex) 2x leverage = 200; 0.25x leverage = 25.
    */
    function placeOrder(string memory _asset, bool _isBuy, uint256 _leverageFactor) external;

    /**
    * @notice Simulates a market order to close the position in the given asset.
    * @dev This function can only be called by the VTE owner.
    * @dev Transaction will revert if the VTE does not have a position in the given asset.
    * @param _asset Symbol of the asset.
    */
    function closePosition(string memory _asset) external;

    /**
    * @notice Sets the address of the VTE's VirtualTradingEnvironmentDataFeed contract.
    * @dev This function can only be called once by the VirtualTradingEnvironmentRegistry contract.
    * @param _dataFeed Address of the VirtualTradingEnvironmentDataFeed contract.
    */
    function setDataFeed(address _dataFeed) external;
}