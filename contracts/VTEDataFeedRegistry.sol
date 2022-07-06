// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Interfaces.
import './interfaces/IVTEDataFeed.sol';
import './interfaces/IVirtualTradingEnvironment.sol';

// Internal references.
import './VTEDataFeed.sol';

// Inheritance.
import './interfaces/IVTEDataFeedRegistry.sol';
import './openzeppelin-solidity/contracts/Ownable.sol';

// OpenZeppelin.
import './openzeppelin-solidity/contracts/SafeMath.sol';
import './openzeppelin-solidity/contracts/ERC20/SafeERC20.sol';

contract VTEDataFeedRegistry is IVTEDataFeedRegistry, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address immutable feeToken;
    address immutable feePool;
    address immutable oracle;

    // Address of the user/contract that can update the settings of this contract.
    // Operator is initially the contract owner.
    address public operator;

    // Address of the user/contract that can register new data feeds.
    // Registrar is initially the contract owner.
    address public registrar;

    // Keeps track of the total number of data feeds registered under this contract.
    uint256 public numberOfDataFeeds;

    // (VTE address => VTE's data feed address).
    mapping (address => address) public dataFeeds;

    // (data feed index => address of data feed's virtual trading environment).
    // Starts at index 1.
    mapping (uint256 => address) public indexes;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _feePool, address _feeToken, address _oracle) Ownable() {
        operator = msg.sender;
        registrar = msg.sender;
        feePool = _feePool;
        feeToken = _feeToken;
        oracle = _oracle;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the address of the given VTE's data feed's fee token.
    * @dev Returns address(0) if the given VTE does not have a data feed.
    * @param _VTE Address of the virtual trading environment.
    * @return address Address of the data feed's fee token.
    */
    function usageFeeToken(address _VTE) external view override returns (address) {
        address dataFeed = dataFeeds[_VTE];
        if (dataFeed == address(0)) {
            return address(0);
        }

        return IVTEDataFeed(dataFeed).feeToken();
    }

    /**
    * @notice Returns the fee for querying the given VTE's data feed.
    * @dev Price is based in fee token and is scaled to 18 decimals.
    * @dev Returns 0 if the given VTE does not have a data feed.
    */
    function usageFee(address _VTE) external view override returns (uint256) {
        address dataFeed = dataFeeds[_VTE];
        if (dataFeed == address(0)) {
            return 0;
        }

        return IVTEDataFeed(dataFeed).usageFee();
    }

    /**
    * @notice Given the address of a VTE, returns the VTE's data feed info.
    * @dev Returns 0 or address(0) for each value if the given VTE does not have a data feed.
    * @param _VTE Address of the VTE.
    * @return (address, address, address, address, uint256) Address of the data feed, address of the data feed's VTE, address of the VTE owner, address of the dedicated data provider, usage fee.
    */
    function getDataFeedInfo(address _VTE) external view override returns (address, address, address, address, uint256) {
        address dataFeed = dataFeeds[_VTE];
        if (dataFeed == address(0)) {
            return (address(0), address(0), address(0), address(0), 0);
        }

        return (dataFeed, _VTE, IVirtualTradingEnvironment(_VTE).owner(), IVTEDataFeed(dataFeed).dataProvider(), IVTEDataFeed(dataFeed).usageFee());
    }

    /**
    * @notice Returns the timestamp at which the given VTE's data feed was last updated.
    * @dev Returns 0 if the given VTE does not have a data feed.
    * @param _VTE Address of the virtual trading environment.
    */
    function lastUpdated(address _VTE) external view override returns (uint256) {
        address dataFeed = dataFeeds[_VTE];
        if (dataFeed == address(0)) {
            return 0;
        }

        return IVTEDataFeed(dataFeed).lastUpdated();
    }

    /**
     * @notice Returns the order info for the given VTE at the given index.
     * @dev Returns 0 for each value if the VTE does not have a data feed or the given index is out of bounds.
     * @param _VTE Address of the virtual trading environment.
     * @param _index Index of the order.
     * @return (string, bool, uint256, uint256, uint256) Symbol of the asset, whether the order was a 'buy', timestamp, asset's price, and leverage factor.
     */
    function getOrderInfo(address _VTE, uint256 _index) external view override returns (string memory, bool, uint256, uint256, uint256) {
        address dataFeed = dataFeeds[_VTE];
        if (dataFeed == address(0)) {
            return ("", false, 0, 0, 0);
        }

        return IVTEDataFeed(dataFeed).getOrderInfo(_index);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Returns the current token price of the given VTE.
     * @dev Contracts calling this function need to pay the usage fee.
     * @dev Returns 0 if the given VTE does not have a data feed.
     * @dev Assumes that feeToken.approve(Registry contract address, usage fee) has been called externally.
     * @param _VTE Address of the virtual trading environment.
     * @return (uint256) Price of the VTE's token, in USD.
     */
    function getTokenPrice(address _VTE) external override returns (uint256) {
        address dataFeed = dataFeeds[_VTE];
        require(dataFeed != address(0), "VTEDataFeedRegistry: Data feed not found.");

        // Collect data feed's usage fee from caller.
        uint256 fee = IVTEDataFeed(dataFeed).usageFee();
        IERC20(feeToken).safeTransferFrom(msg.sender, address(this), fee);
        IERC20(feeToken).approve(dataFeed, fee);

        return IVTEDataFeed(dataFeed).getTokenPrice();
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Registers a new data feed to the platform.
    * @dev Only the contract operator can call this function.
    * @dev Transaction will revert if a data feed already exists for the given VTE.
    * @param _VTE Address of the virtual trading environment.
    * @param _usageFee Number of fee tokens to charge whenever a contract queries the data feed.
    * @param _dedicatedDataProvider Address of the data provider responsible for this data feed.
    */
    function registerDataFeed(address _VTE, uint256 _usageFee, address _dedicatedDataProvider) external override onlyRegistrar {
        require(dataFeeds[_VTE] == address(0), "VTEDataFeedRegistry: Already have a data feed for this VTE.");
        require(_usageFee >= 0, "VTEDataFeedRegistry: Usage fee must be positive.");

        address dataFeed = address(new VTEDataFeed(_dedicatedDataProvider, address(this), feePool, oracle, _VTE, feeToken, _usageFee));

        dataFeeds[_VTE] = dataFeed;
        numberOfDataFeeds = numberOfDataFeeds.add(1);
        indexes[numberOfDataFeeds] = _VTE;

        emit RegisteredDataFeed(_VTE, _usageFee, _dedicatedDataProvider, dataFeed);
    }

    /**
    * @notice Updates the operator of this contract.
    * @dev Only the contract owner can call this function.
    * @param _newOperator Address of the new operator.
    */
    function setOperator(address _newOperator) external onlyOwner {
        // Update the operator of each data feed first.
        uint256 n = numberOfDataFeeds;
        for (uint256 i = 1; i <= n; i++) {
            IVTEDataFeed(dataFeeds[indexes[i]]).setOperator(_newOperator);
        }

        operator = _newOperator;

        emit SetOperator(_newOperator);
    }

    /**
    * @notice Updates the registrar address.
    * @dev Only the contract owner can call this function.
    * @param _newRegistrar Address of the new registrar.
    */
    function setRegistrar(address _newRegistrar) external onlyOwner {
        registrar = _newRegistrar;

        emit SetRegistrar(_newRegistrar);
    }

    /**
    * @notice Updates the operator of the given VTE's data feed.
    * @dev Only the operator of this contract can call this function.
    * @param _VTE Address of the virtual trading environment.
    * @param _newOperator Address of the new operator.
    */
    function setDataFeedOperator(address _VTE, address _newOperator) external onlyOperator {
        address dataFeed = dataFeeds[_VTE];
        require(dataFeed != address(0), "VTEDataFeedRegistry: Data feed not found.");

        IVTEDataFeed(dataFeed).setOperator(_newOperator);
    }

    /**
    * @notice Updates the address of the data provider allowed to update the given VTE's data feed.
    * @dev Only the operator of this contract can call this function.
    * @param _VTE Address of the virtual trading environment.
    * @param _newProvider Address of the new data provider.
    */
    function updateDedicatedDataProvider(address _VTE, address _newProvider) external onlyOperator {
        address dataFeed = dataFeeds[_VTE];
        require(dataFeed != address(0), "VTEDataFeedRegistry: Data feed not found.");

        IVTEDataFeed(dataFeed).updateDedicatedDataProvider(_newProvider);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyOperator() {
        require(msg.sender == operator, "VTEDataFeedRegistry: Only the contract operator can call this function.");
        _;
    }

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "VTEDataFeedRegistry: Only the registrar can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event RegisteredDataFeed(address VTE, uint256 usageFee, address dedicatedDataProvider, address dataFeed);
    event SetOperator(address newOperator);
    event SetRegistrar(address newRegistrar);
}