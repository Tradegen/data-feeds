// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Inheritance.
import './interfaces/IBotPerformanceDataFeed.sol';

// Interfaces.
import './interfaces/ICandlestickDataFeedRegistry.sol';
import './interfaces/IFeePool.sol';
import './interfaces/ITradingBot.sol';

// OpenZeppelin.
import './openzeppelin-solidity/contracts/SafeMath.sol';
import './openzeppelin-solidity/contracts/ERC20/SafeERC20.sol';

contract BotPerformanceDataFeed is IBotPerformanceDataFeed {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== CONSTANTS ========== */

    // Maximum number of seconds between data feed updates before the data feed is considered outdated.
    uint256 public constant MAX_TIME_BETWEEN_UPDATES = 60;

    // Maximum usage fee is 1,000 fee tokens.
    uint256 public constant MAX_USAGE_FEE = 1e21;

    // Maximum increase of 20% at a time.
    // Denominated in 10000.
    uint256 public constant MAX_FEE_INCREASE = 2000;

    // Minimum amount of time between fee changes.
    uint256 public constant MIN_TIME_BETWEEN_FEE_CHANGES = 1 days;

    /* ========== STATE VARIABLES ========== */

    // Timestamp of the last usage fee update.
    uint256 private lastFeeChangeTimestamp;

    // Timestamp at which this data feed was created.
    uint256 public override createdOn;

    // Whether the data feed is halted.
    bool public isHalted;

    // Address of the user/contract responsible for supplying data to this contract.
    address public override dataProvider;

    // Address of the user/contract that can update the settings of this contract.
    // Operator is initially the contract owner.
    address public operator;

    // Stores usage fees.
    IFeePool public immutable feePool;

    // Used for getting the current price of an asset.
    ICandlestickDataFeedRegistry public immutable candlestickDataFeedRegistry;

    // Address of the data feed's trading bot.
    address public immutable tradingBot;

    // The token that is used for paying usage fees.
    address public immutable override feeToken;

    // Number of fee tokens to pay whenever a contract view the current bot price.
    // Fee tokens are sent to the trading bot owner via the FeePool contract.
    uint256 public override usageFee;

    // Keeps track of the total number of updates this data feed has made.
    uint256 public numberOfUpdates;

    // Timestamp at which the last update was made.
    uint256 public override lastUpdated;

    // (update index => order info).
    // Starts at index 1.
    mapping (uint256 => Order) private orders;

    // (update index => timestamp at which the update was made).
    mapping (uint256 => uint256) public indexTimestamps;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _dataProvider, address _operator, address _feePool, address _candlestickDataFeedRegistry, address _tradingBot, address _feeToken, uint256 _usageFee) {
        require(_usageFee <= MAX_USAGE_FEE, "BotPerformanceDataFeed: Cannot exceed maximum usage fee.");

        dataProvider = _dataProvider;
        operator = _operator;
        feePool = IFeePool(_feePool);
        candlestickDataFeedRegistry = ICandlestickDataFeedRegistry(_candlestickDataFeedRegistry);
        tradingBot = _tradingBot;
        feeToken = _feeToken;
        usageFee = _usageFee;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Returns the timestamp at which the update at the given index was made.
    * @param _index Index in this data feed's history of updates.
    * @return uint256 Timestamp at which the update was made.
    */
    function getIndexTimestamp(uint256 _index) external view override returns (uint256) {
        return indexTimestamps[_index];
    }

    /**
    * @notice Returns the status of this data feed.
    * @dev 0 = Active.
    * @dev 1 = Outdated.
    * @dev 2 = Halted.
    */
    function getDataFeedStatus() external view override returns (uint256) {
        if (isHalted) {
            return 2;
        }

        if (block.timestamp > lastUpdated.add(MAX_TIME_BETWEEN_UPDATES)) {
            return 1;
        }

        return 0;
    }

    /**
     * @notice Returns the order info at the given index.
     * @param _index Index of the order.
     * @return (address, bool, uint256, uint256) Address of the asset, whether the order was a 'buy', timestamp, asset's price.
     */
    function getOrderInfo(uint256 _index) external view override returns (address, bool, uint256, uint256) {
        // Gas savings.
        Order memory order = orders[_index];

        return (order.asset, order.isBuy, order.timestamp, order.assetPrice);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Adds the order to the ledger and updates the trading bot's token price.
     * @dev This function is meant to be called by the dedicated data provider whenever the bot's keeper
     *          updates entry/exit rules with the latest asset price.
     * @dev Position size is not included because trading bots always use their max buying power for each trade.
     * @param _asset Address of the asset.
     * @param _isBuy Whether the order is a 'buy' order
     * @param _price Price at which the order executed.
     */
    function updateData(address _asset, bool _isBuy, uint256 _price) external override onlyDataProvider notHalted {
        // Gas savings.
        uint256 index = numberOfUpdates.add(1);
        uint256 botPrice = _calculateTokenPrice();

        orders[index] = Order({
            asset: _asset,
            isBuy: _isBuy,
            timestamp: block.timestamp,
            assetPrice: _price,
            newBotPrice: botPrice
        });

        numberOfUpdates = index;
        indexTimestamps[index] = block.timestamp;
        lastUpdated = block.timestamp;

        emit UpdatedData(index, _asset, _isBuy, _price, botPrice);
    }

    /**
     * @notice Returns the current token price of the trading bot.
     * @dev Contracts calling this function need to pay the usage fee.
     * @return (uint256) Price of the trading bot's token, in USD.
     */
    function getTokenPrice() external override returns (uint256) {
        // Collects the usage fee from the caller.
        IERC20(feeToken).safeTransferFrom(msg.sender, address(this), usageFee);

        // Transfers the usage fee to the trading bot owner via FeePool contract.
        IERC20(feeToken).approve(address(feePool), usageFee);
        feePool.addFees(ITradingBot(tradingBot).owner(), usageFee);

        emit GetTokenPrice(msg.sender, usageFee);

        return _calculateTokenPrice();
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
     * @notice Calculates the current token price of this trading bot.
     * @dev If the trading bot is not currently in a trade (latest order is a 'sell'),
     *      token price is the token price when the latest order was made.
     * @dev If the trading bot is in a trade (latest order is a 'buy'), token price is the
     *      token price at latest order multiplied by (1 + change in asset price).
     * @dev Assumes that each 'buy' order is followed by a 'sell' order with the same asset.
     * @dev Price is denominated in USD.
     */
    function _calculateTokenPrice() internal view returns (uint256) {
        // Price starts at $1.
        if (numberOfUpdates == 0) {
            return 1e18;
        }

        // Gas savings.
        Order memory latestOrder = orders[numberOfUpdates];

        return (latestOrder.isBuy) ? candlestickDataFeedRegistry.getCurrentPrice(latestOrder.asset).mul(latestOrder.newBotPrice).div(latestOrder.assetPrice) : latestOrder.newBotPrice;
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Updates the address of the data provider allowed to update this data feed.
    * @dev Only the contract operator can call this function.
    * @param _newProvider Address of the new data provider.
    */
    function updateDedicatedDataProvider(address _newProvider) external override onlyOperator {
        require(_newProvider != address(0), "BotPerformanceDataFeed: Invalid address for _newProvider.");

        dataProvider = _newProvider;

        emit UpdatedDedicatedDataProvider(_newProvider);
    }

    /**
    * @notice Updates the operator of this contract.
    * @dev Only the contract owner can call this function.
    * @param _newOperator Address of the new operator.
    */
    function setOperator(address _newOperator) external override onlyOperator {
        require(_newOperator != address(0), "BotPerformanceDataFeed: Invalid address for _newOperator.");

        operator = _newOperator;

        emit SetOperator(_newOperator);
    }

    /**
    * @notice Sets the data feed's 'halted' status.
    * @dev Only the contract operator can call this function.
    * @param _isHalted Whether to mark the contract as 'halted'.
    */
    function haltDataFeed(bool _isHalted) external override onlyOperator {
        isHalted = _isHalted;

        emit HaltDataFeed(_isHalted);
    }

    /**
    * @notice Updates the usage fee for this data feed.
    * @dev Only the data feed owner (trading bot owner) can call this function.
    * @dev Assumes that the given fee is scaled to 18 decimals.
    */
    function updateUsageFee(uint256 _newFee) external override onlyTradingBotOwner {
        require(_newFee <= MAX_USAGE_FEE, "BotPerformanceDataFeed: New usage fee cannot be greater than the max usage fee.");
        require(block.timestamp.sub(lastFeeChangeTimestamp) >= MIN_TIME_BETWEEN_FEE_CHANGES, "BotPerformanceDataFeed: Not enough time between fee changes.");
        
        if (_newFee > usageFee) {
            uint256 feeIncrease = (_newFee.sub(usageFee)).mul(10000).div(usageFee);
            require(feeIncrease <= MAX_FEE_INCREASE, "BotPerformanceDataFeed: Fee increase is too large.");
        }

        usageFee = _newFee;
        lastFeeChangeTimestamp = block.timestamp;

        emit UpdatedUsageFee(_newFee);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyOperator() {
        require(msg.sender == operator, "BotPerformanceDataFeed: Only the operator can call this function.");
        _;
    }

    modifier onlyDataProvider() {
        require(msg.sender == dataProvider, "BotPerformanceDataFeed: Only the data provider can call this function.");
        _;
    }

    modifier onlyTradingBotOwner() {
        require(msg.sender == ITradingBot(tradingBot).owner(), "BotPerformanceDataFeed: Only the trading bot owner can call this function.");
        _;
    }

    modifier notHalted() {
        require(!isHalted, "BotPerformanceDataFeed: This function cannot be called when the contract is halted.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedData(uint256 index, address asset, bool isBuy, uint256 assetPrice, uint256 botPrice);
    event UpdatedDedicatedDataProvider(address newProvider);
    event SetOperator(address newOperator);
    event HaltDataFeed(bool isHalted);
    event UpdatedUsageFee(uint256 newFee);
    event GetTokenPrice(address caller, uint256 amountPaid);
}