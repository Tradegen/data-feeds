// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

interface IVTEDataFeedFactory {
    /**
    * @notice Deploys a VTEDataFeed contract and returns the contract's address.
    * @dev This function can only be called by the VTEDataFeedRegistry contract.
    * @param _VTE Address of the VirtualTradingEnvironment contract.
    * @param _usageFee Fee that a user pays whenever they request data for this VTE.
    * @return address Address of the deployed VTEDataFeed contract.
    */
    function createVTEDataFeed(address _VTE, uint256 _usageFee) external returns (address);
}