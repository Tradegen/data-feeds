// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// OpenZeppelin.
import "./openzeppelin-solidity/contracts/Ownable.sol";

// Internal references.
import './VTEDataFeed.sol';

// Inheritance.
import './interfaces/IVTEDataFeedFactory.sol';

contract VTEDataFeedFactory is IVTEDataFeedFactory, Ownable {
    address public immutable oracle;
    address public immutable feePool;
    address public immutable feeToken;
    address public VTEDataFeedRegistry;

    constructor(address _oracle, address _feePool, address _feeToken) Ownable() {
        oracle = _oracle;
        feePool = _feePool;
        feeToken = _feeToken;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Deploys a VTEDataFeed contract and returns the contract's address.
    * @dev This function can only be called by the VTEDataFeedRegistry contract.
    * @param _VTE Address of the VirtualTradingEnvironment contract.
    * @param _operator Address of the VTE owner.
    * @param _usageFee Fee that a user pays whenever they request data for this VTE.
    * @return address Address of the deployed VTEDataFeed contract.
    */
    function createVTEDataFeed(address _VTE, address _operator, uint256 _usageFee) external override onlyVTEDataFeedRegistry returns (address) {
        address VTEDataFeedAddress = address(new VTEDataFeed(_VTE, _operator, feePool, oracle, _VTE, feeToken, _usageFee));

        emit CreatedVTEDataFeed(_VTE, VTEDataFeedAddress, _usageFee);

        return VTEDataFeedAddress;
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Sets the address of the VTEDataFeedRegistry contract.
    * @dev The address is initialized outside of the constructor to avoid a circular dependency with VTEDataFeedRegistry.
    * @dev This function can only be called by the VTEDataFeedFactory owner.
    * @param _registry Address of the VTEDataFeedRegistry contract.
    */
    function initializeContract(address _registry) external onlyOwner {
        VTEDataFeedRegistry = _registry;

        emit InitializedContract(_registry);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyVTEDataFeedRegistry() {
        require(msg.sender == VTEDataFeedRegistry,
                "VTEDataFeedFactory: Only the VTEDataFeedRegistry contract can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedVTEDataFeed(address VTE, address VTEData, uint256 usageFee);
    event InitializedContract(address registryAddress);
}