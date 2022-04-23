// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6;

interface IFeePool {
    /**
    * @notice Returns the available fees for the given user.
    */
    function availableFees(address) external view returns (uint256);

    /**
    * @notice Adds fees to the given account.
    * @dev Assumes that this contract has allowance for fee token when transfering token.
    * @dev Only the dedicated fee supplier can call this function.
    * @param _account Address of the user to add fees to.
    * @param _amount Amount of fee tokens to transfer.
    */
    function addFees(address _account, uint256 _amount) external;

    /**
    * @notice Claims all available fees for msg.sender.
    */
    function claimFees() external;

    /**
    * @notice Sets the address of the dedicated fee supplier.
    * @dev Only the contract operator can call this function.
    * @param _newSupplier Address of the new fee supplier.
    */
    function setFeeSupplier(address _newSupplier) external;
}