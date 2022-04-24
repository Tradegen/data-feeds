// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Interfaces.
import './interfaces/IBotPerformanceDataFeed.sol';
import './interfaces/ITradingBot.sol';

// Internal references.
import './BotPerformanceDataFeed.sol';

// Inheritance.
import './interfaces/IBotPerformanceDataFeedRegistry.sol';
import './openzeppelin-solidity/contracts/Ownable.sol';

// OpenZeppelin.
import './openzeppelin-solidity/contracts/SafeMath.sol';
import './openzeppelin-solidity/contracts/ERC20/SafeERC20.sol';

contract BotPerformanceDataFeedRegistry is IBotPerformanceDataFeedRegistry, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public immutable feeToken;
    address public immutable feePool;
    address public immutable candlestickDataFeedRegistry;

    // Address of the user/contract that can update the settings of this contract.
    // Operator is initially the contract owner.
    address public operator;

    // Keeps track of the total number of data feeds registered under this contract.
    uint256 public numberOfDataFeeds;

    // (trading bot address => trading bot's data feed address).
    mapping (address => address) public dataFeeds;

    // (data feed index => address of data feed's trading bot).
    // Starts at index 1.
    mapping (uint256 => address) public indexes;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _feePool, address _candlestickDataFeedRegistry, address _feeToken) Ownable() {
        operator = msg.sender;
        feePool = _feePool;
        candlestickDataFeedRegistry = _candlestickDataFeedRegistry;
        feeToken = _feeToken;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the address of the given trading bot's data feed's fee token.
    * @dev Returns address(0) if the given trading bot does not have a data feed.
    * @param _tradingBot Address of the trading bot.
    * @return address Address of the data feed's fee token.
    */
    function usageFeeToken(address _tradingBot) external view override returns (address) {
        address dataFeed = dataFeeds[_tradingBot];
        if (dataFeed == address(0)) {
            return address(0);
        }

        return IBotPerformanceDataFeed(dataFeed).feeToken();
    }

    /**
    * @notice Returns the fee for querying the given trading bot's data feed.
    * @dev Price is based in fee token and is scaled to 18 decimals.
    * @dev Returns 0 if the given trading bot does not have a data feed.
    */
    function usageFee(address _tradingBot) external view override returns (uint256) {
        address dataFeed = dataFeeds[_tradingBot];
        if (dataFeed == address(0)) {
            return 0;
        }

        return IBotPerformanceDataFeed(dataFeed).usageFee();
    }

    /**
    * @notice Given the address of a trading bot, returns the trading bot's data feed info.
    * @dev Returns 0 or address(0) for each value if the given trading bot does not have a data feed.
    * @param _tradingBot Address of the trading bot.
    * @return (address, address, address, address, uint256) Address of the data feed, address of the data feed's trading bot, address of the trading bot owner, address of the dedicated data provider, usage fee.
    */
    function getDataFeedInfo(address _tradingBot) external view override returns (address, address, address, address, uint256) {
        address dataFeed = dataFeeds[_tradingBot];
        if (dataFeed == address(0)) {
            return (address(0), address(0), address(0), address(0), 0);
        }

        return (dataFeed, _tradingBot, ITradingBot(_tradingBot).owner(), IBotPerformanceDataFeed(dataFeed).dataProvider(), IBotPerformanceDataFeed(dataFeed).usageFee());
    }

    /**
    * @notice Given the address of a trading bot, returns the address of the trading bot's data feed.
    * @dev Returns address(0) if the given trading bot does not have a data feed.
    * @param _tradingBot Address of the trading bot.
    * @return address Address of the data feed.
    */
    function getDataFeedAddress(address _tradingBot) external view override returns (address) {
        return dataFeeds[_tradingBot];
    }

    /**
    * @notice Returns the timestamp at which the given trading bot's data feed was last updated.
    * @dev Returns 0 if the given trading bot does not have a data feed.
    * @param _tradingBot Address of the trading bot.
    */
    function lastUpdated(address _tradingBot) external view override returns (uint256) {
        address dataFeed = dataFeeds[_tradingBot];
        if (dataFeed == address(0)) {
            return 0;
        }

        return IBotPerformanceDataFeed(dataFeed).lastUpdated();
    }

    /**
    * @notice Returns the status of the given trading bot's data feed.
    * @param _tradingBot Address of the trading bot.
    */
    function getDataFeedStatus(address _tradingBot) external view override returns (uint256) {
        address dataFeed = dataFeeds[_tradingBot];
        if (dataFeed == address(0)) {
            return 3;
        }

        return IBotPerformanceDataFeed(dataFeed).getDataFeedStatus();
    }

    /**
    * @notice Given the address of a trading bot, returns whether the trading bot has a data feed.
    * @param _tradingBot Address of the trading bot.
    * @return bool Whether the given trading bot has a data feed.
    */
    function hasDataFeed(address _tradingBot) external view override returns (bool) {
        return dataFeeds[_tradingBot] != address(0);
    }

    /**
     * @notice Returns the order info for the given trading bot at the given index.
     * @dev Returns 0 for each value if the trading bot does not have a data feed or the given index is out of bounds.
     * @param _tradingBot Address of the trading bot.
     * @param _index Index of the order.
     * @return (address, bool, uint256, uint256) Address of the asset, whether the order was a 'buy', timestamp, asset's price.
     */
    function getOrderInfo(address _tradingBot, uint256 _index) external view override returns (address, bool, uint256, uint256) {
        address dataFeed = dataFeeds[_tradingBot];
        if (dataFeed == address(0)) {
            return (address(0), false, 0, 0);
        }

        return IBotPerformanceDataFeed(dataFeed).getOrderInfo(_index);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Returns the current token price of the given trading bot.
     * @dev Contracts calling this function need to pay the usage fee.
     * @dev Returns 0 if the given trading bot does not have a data feed.
     * @dev Assumes that feeToken.approve(Registry contract address, usage fee) has been called externally.
     * @param _tradingBot Address of the trading bot.
     * @return (uint256) Price of the trading bot's token, in USD.
     */
    function getTokenPrice(address _tradingBot) external override returns (uint256) {
        address dataFeed = dataFeeds[_tradingBot];
        require(dataFeed != address(0), "BotPerformanceDataFeedRegistry: Data feed not found.");

        // Collect data feed's usage fee from caller.
        uint256 fee = IBotPerformanceDataFeed(dataFeed).usageFee();
        IERC20(feeToken).safeTransferFrom(msg.sender, address(this), fee);
        IERC20(feeToken).approve(dataFeed, fee);

        return IBotPerformanceDataFeed(dataFeed).getTokenPrice();
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Registers a new data feed to the platform.
    * @dev Only the contract operator can call this function.
    * @dev Transaction will revert if a data feed already exists for the given trading bot.
    * @param _tradingBot Address of the trading bot.
    * @param _usageFee Number of fee tokens to charge whenever a contract queries the data feed.
    * @param _dedicatedDataProvider Address of the data provider responsible for this data feed.
    */
    function registerDataFeed(address _tradingBot, uint256 _usageFee, address _dedicatedDataProvider) external override onlyOperator {
        require(_tradingBot != address(0), "BotPerformanceDataFeedRegistry: Invalid address for _tradingBot.");
        require(_dedicatedDataProvider != address(0), "BotPerformanceDataFeedRegistry: Invalid address for _dedicatedDataProvider.");
        require(dataFeeds[_tradingBot] == address(0), "BotPerformanceDataFeedRegistry: Already have a data feed for this trading bot.");
        require(_usageFee >= 0, "BotPerformanceDataFeedRegistry: Usage fee must be positive.");

        address dataFeed = address(new BotPerformanceDataFeed(_dedicatedDataProvider, operator, feePool, candlestickDataFeedRegistry, _tradingBot, feeToken, _usageFee));

        dataFeeds[_tradingBot] = dataFeed;
        numberOfDataFeeds = numberOfDataFeeds.add(1);
        indexes[numberOfDataFeeds] = _tradingBot;

        emit RegisteredDataFeed(_tradingBot, _usageFee, _dedicatedDataProvider, dataFeed);
    }

    /**
    * @notice Updates the operator of this contract.
    * @dev Only the contract owner can call this function.
    * @param _newOperator Address of the new operator.
    */
    function setOperator(address _newOperator) external onlyOwner {
        require(_newOperator != address(0), "BotPerformanceDataFeedRegistry: Invalid address for _newOperator.");

        // Update the operator of each data feed first.
        uint256 n = numberOfDataFeeds;
        for (uint256 i = 1; i <= n; i++) {
            IBotPerformanceDataFeed(dataFeeds[indexes[i]]).setOperator(_newOperator);
        }

        operator = _newOperator;

        emit SetOperator(_newOperator);
    }

    /**
    * @notice Updates the operator of the given trading bot's data feed.
    * @dev Only the operator of this contract can call this function.
    * @param _tradingBot Address of the trading bot.
    * @param _newOperator Address of the new operator.
    */
    function setDataFeedOperator(address _tradingBot, address _newOperator) external onlyOperator {
        address dataFeed = dataFeeds[_tradingBot];
        require(dataFeed != address(0), "BotPerformanceDataFeedRegistry: Data feed not found.");

        IBotPerformanceDataFeed(dataFeed).setOperator(_newOperator);
    }

    /**
    * @notice Updates the address of the data provider allowed to update the given trading bot's data feed.
    * @dev Only the operator of this contract can call this function.
    * @param _tradingBot Address of the trading bot.
    * @param _newProvider Address of the new data provider.
    */
    function updateDedicatedDataProvider(address _tradingBot, address _newProvider) external onlyOperator {
        address dataFeed = dataFeeds[_tradingBot];
        require(dataFeed != address(0), "BotPerformanceDataFeedRegistry: Data feed not found.");

        IBotPerformanceDataFeed(dataFeed).updateDedicatedDataProvider(_newProvider);
    }

    /**
    * @notice Sets the given trading bot's data feed's 'halted' status.
    * @dev Only the operator of this contract can call this function.
    * @param _tradingBot Address of the trading bot.
    * @param _isHalted Whether to mark the contract as 'halted'.
    */
    function haltDataFeed(address _tradingBot, bool _isHalted) external onlyOperator {
        address dataFeed = dataFeeds[_tradingBot];
        require(dataFeed != address(0), "BotPerformanceDataFeedRegistry: Data feed not found.");

        IBotPerformanceDataFeed(dataFeed).haltDataFeed(_isHalted);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyOperator() {
        require(msg.sender == operator, "BotPerformanceDataFeedRegistry: Only the contract operator can call this function.");
        _;
    }

    /* ========== EVENTS ========== */

    event RegisteredDataFeed(address tradingBot, uint256 usageFee, address dedicatedDataProvider, address dataFeed);
    event SetOperator(address newOperator);
}