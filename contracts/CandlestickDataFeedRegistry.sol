// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Interfaces.
import './interfaces/ICandlestickDataFeed.sol';

// Internal references.
import './CandlestickDataFeed.sol';

// Inheritance.
import './interfaces/ICandlestickDataFeedRegistry.sol';
import './openzeppelin-solidity/contracts/Ownable.sol';

// OpenZeppelin.
import './openzeppelin-solidity/contracts/SafeMath.sol';

contract CandlestickDataFeedRegistry is ICandlestickDataFeedRegistry, Ownable {
    using SafeMath for uint256;

    // Address of the user/contract that can update the settings of this contract.
    // Operator is initially the contract owner.
    address public operator;

    // Address of the user/contract that can register new data feeds.
    // Registrar is initially the contract owner.
    address public registrar;

    // Keeps track of the total number of data feeds registered under this contract.
    uint256 public numberOfDataFeeds;

    // (asset symbol => asset's data feed address).
    mapping (string => address) public dataFeeds;

    // (data feed index => symbol of data feed's asset).
    // Starts at index 1.
    mapping (uint256 => string) public indexes;

    /* ========== CONSTRUCTOR ========== */

    constructor() Ownable() {
        operator = msg.sender;
        registrar = msg.sender;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Gets the current price of the given asset's data feed.
    * @dev Current price is the 'close' price of the latest candlestick.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @dev Returns 0 if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @return uint256 The current USD price of the given asset.
    */
    function getCurrentPrice(string memory _asset) public view override returns (uint256) {
        address dataFeed = dataFeeds[_asset];
        if (dataFeed == address(0)) {
            return 0;
        }

        return ICandlestickDataFeed(dataFeed).getCurrentPrice();
    }

    /**
    * @notice Gets the price of the given asset's data feed at the given index.
    * @dev Index must come before the current index.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @dev Returns 0 if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _index Index in the data feed's history.
    * @return uint256 The USD price at the given index.
    */
    function getPriceAt(string memory _asset, uint256 _index) public view override returns (uint256) {
        address dataFeed = dataFeeds[_asset];
        if (dataFeed == address(0)) {
            return 0;
        }

        return ICandlestickDataFeed(dataFeed).getPriceAt(_index);
    }

    /**
    * @notice Gets the current candlestick of the given asset's data feed.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @dev Returns 0 for each value if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256, uint256) The candlestick index, high price, low price, open price, close price, volume, and starting timestamp.
    */
    function getCurrentCandlestick(string memory _asset) public view override returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        address dataFeed = dataFeeds[_asset];
        if (dataFeed == address(0)) {
            return (0, 0, 0, 0, 0, 0, 0);
        }

        return ICandlestickDataFeed(dataFeed).getCurrentCandlestick();
    }

    /**
    * @notice Gets the candlestick of the given asset's data feed at the given index.
    * @dev Index must come before the current index.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @dev Returns 0 for each value if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _index Index in the data feed's history.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256, uint256) The candlestick index, high price, low price, open price, close price, volume, and starting timestamp.
    */
    function getCandlestickAt(string memory _asset, uint256 _index) public view override returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        address dataFeed = dataFeeds[_asset];
        if (dataFeed == address(0)) {
            return (0, 0, 0, 0, 0, 0, 0);
        }

        return ICandlestickDataFeed(dataFeed).getCandlestickAt(_index);
    }

    /**
    * @notice Given the symbol of an asset, returns the asset's data feed info.
    * @dev Returns 0 or address(0) for each value if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @return (address, address, address, uint256, uint256) Address of the data feed, symbol of the data feed's asset, address of the dedicated data provider, timestamp when the data feed was created, current price.
    */
    function getDataFeedInfo(string memory _asset) public view override returns (address, string memory, address, uint256, uint256) {
        address dataFeed = dataFeeds[_asset];
        if (dataFeed == address(0)) {
            return (address(0), "", address(0), 0, 0);
        }

        return (dataFeed, _asset, ICandlestickDataFeed(dataFeed).dataProvider(), ICandlestickDataFeed(dataFeed).createdOn(), ICandlestickDataFeed(dataFeed).getCurrentPrice());
    }

    /**
    * @notice Given the symbol of an asset, returns the address of the asset's data feed.
    * @dev Returns address(0) if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    */
    function getDataFeedAddress(string memory _asset) public view override returns (address) {
        return dataFeeds[_asset];
    }

    /**
    * @notice Returns the timestamp at which the given asset's data feed was last updated.
    * @dev Returns 0 if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    */
    function lastUpdated(string memory _asset) public view override returns (uint256) {
        address dataFeed = dataFeeds[_asset];
        if (dataFeed == address(0)) {
            return 0;
        }

        return ICandlestickDataFeed(dataFeed).lastUpdated();
    }

    /**
    * @notice Returns the status of the given asset's data feed.
    * @dev 0 = Active.
    * @dev 1 = Outdated.
    * @dev 2 = Halted.
    * @dev 3 = Data feed not found.
    * @param _asset Symbol of the asset.
    */
    function getDataFeedStatus(string memory _asset) public view override returns (uint256) {
        address dataFeed = dataFeeds[_asset];
        if (dataFeed == address(0)) {
            return 3;
        }

        return ICandlestickDataFeed(dataFeed).getDataFeedStatus();
    }

    /**
    * @notice Aggregates the given number of candlesticks into one candlestick, representing a higher timeframe.
    * @dev If there are not enough candlesticks in the data feed's history, the function will aggregate all candlesticks in the data feed's history.
    *      Ex) If user wants to aggregate 60 candlesticks but the data feed only has 50 candlesticks, the function will return a candlestick of size 50 instead of 60.
    * @dev It is not recommended to aggregate more than 10 candlesticks due to gas.
    * @dev Returns 0 for each value if the given asset does not have a data feed.
    * @param _asset Symbol of the asset.
    * @param _numberOfCandlesticks Number of candlesticks to aggregate.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256) High price, low price, open price, close price, total volume, and starting timestamp.
    */
    function aggregateCandlesticks(string memory _asset, uint256 _numberOfCandlesticks) public view override returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        address dataFeed = dataFeeds[_asset];
        if (dataFeed == address(0)) {
            return (0, 0, 0, 0, 0, 0);
        }

        return ICandlestickDataFeed(dataFeed).aggregateCandlesticks(_numberOfCandlesticks);
    }

    /**
    * @notice Given the symbol of an asset, returns whether the asset has a data feed.
    * @param _asset Symbol of the asset.
    * @return bool Whether the given asset has a data feed.
    */
    function hasDataFeed(string memory _asset) public view override returns (bool) {
        return dataFeeds[_asset] != address(0);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Registers a new data feed to the platform.
    * @dev Only the contract operator can call this function.
    * @dev Transaction will revert if a data feed already exists for the given asset.
    * @param _asset Symbol of the asset.
    * @param _dedicatedDataProvider Address of the data provider responsible for this data feed.
    */
    function registerDataFeed(string memory _asset, address _dedicatedDataProvider) external override onlyRegistrar {
        require(_dedicatedDataProvider != address(0), "CandlestickDataFeedRegistry: Invalid address for _dedicatedDataProvider.");
        require(dataFeeds[_asset] == address(0), "CandlestickDataFeedRegistry: Already have a data feed for this asset.");

        address dataFeed = address(new CandlestickDataFeed(_dedicatedDataProvider, address(this), _asset));

        dataFeeds[_asset] = dataFeed;
        numberOfDataFeeds = numberOfDataFeeds.add(1);
        indexes[numberOfDataFeeds] = _asset;

        emit RegisteredDataFeed(_asset, _dedicatedDataProvider, dataFeed);
    }

    /**
    * @notice Updates the operator of this contract.
    * @dev Only the contract owner can call this function.
    * @param _newOperator Address of the new operator.
    */
    function setOperator(address _newOperator) external onlyOwner {
        require(_newOperator != address(0), "CandlestickDataFeedRegistry: Invalid address for _newOperator.");

        // Update the operator of each data feed first.
        uint256 n = numberOfDataFeeds;
        for (uint256 i = 1; i <= n; i++) {
            ICandlestickDataFeed(dataFeeds[indexes[i]]).setOperator(_newOperator);
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
        require(_newRegistrar != address(0), "CandlestickDataFeedRegistry: Invalid address for _newRegistrar.");

        registrar = _newRegistrar;

        emit SetRegistrar(_newRegistrar);
    }

    /**
    * @notice Updates the operator of the given asset's data feed.
    * @dev Only the operator of this contract can call this function.
    * @param _asset Symbol of the asset.
    * @param _newOperator Address of the new operator.
    */
    function setDataFeedOperator(string memory _asset, address _newOperator) external onlyOperator {
        address dataFeed = dataFeeds[_asset];
        require(dataFeed != address(0), "CandlestickDataFeedRegistry: Data feed not found.");

        ICandlestickDataFeed(dataFeed).setOperator(_newOperator);
    }

    /**
    * @notice Updates the address of the data provider allowed to update the given asset's data feed.
    * @dev Only the operator of this contract can call this function.
    * @param _asset Symbol of the asset.
    * @param _newProvider Address of the new data provider.
    */
    function updateDedicatedDataProvider(string memory _asset, address _newProvider) external onlyOperator {
        address dataFeed = dataFeeds[_asset];
        require(dataFeed != address(0), "CandlestickDataFeedRegistry: Data feed not found.");

        ICandlestickDataFeed(dataFeed).updateDedicatedDataProvider(_newProvider);
    }

    /**
    * @notice Sets the given asset's data feed's 'halted' status.
    * @dev Only the operator of this contract can call this function.
    * @param _asset Symbol of the asset.
    * @param _isHalted Whether to mark the contract as 'halted'.
    */
    function haltDataFeed(string memory _asset, bool _isHalted) external onlyOperator {
        address dataFeed = dataFeeds[_asset];
        require(dataFeed != address(0), "CandlestickDataFeedRegistry: Data feed not found.");

        ICandlestickDataFeed(dataFeed).haltDataFeed(_isHalted);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyOperator() {
        require(msg.sender == operator, "CandlestickDataFeedRegistry: Only the contract operator can call this function.");
        _;
    }

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "CandlestickDataFeedRegistry: Only the registrar can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event RegisteredDataFeed(string asset, address dedicatedDataProvider, address dataFeed);
    event SetOperator(address newOperator);
    event SetRegistrar(address newRegistrar);
}