// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

// Inheritance.
import './interfaces/ICandlestickDataFeed.sol';

// OpenZeppelin.
import './openzeppelin-solidity/contracts/SafeMath.sol';

contract CandlestickDataFeed is ICandlestickDataFeed {
    using SafeMath for uint256;

    /* ========== CONSTANTS ========== */

    // Maximum number of seconds between data feed updates before the data feed is considered outdated.
    uint256 public constant MAX_TIME_BETWEEN_UPDATES = 60;

    // Maximum timeframe of 60 minutes (1 hour).
    uint256 public constant MAX_CANDLESTICKS_TO_AGGREGATE = 60;

    /* ========== STATE VARIABLES ========== */

    // Timestamp at which this data feed was created.
    uint256 public override createdOn;

    // Whether the data feed is halted.
    bool public isHalted;

    // Address of the user/contract responsible for supplying data to this contract.
    address public override dataProvider;

    // Address of the user/contract that can update the settings of this contract.
    // Operator is initially the contract owner.
    address public operator;

    // Address of the data feed's asset.
    // For assets deployed on multiple chains, the asset's native chain is used.
    address public immutable asset;

    // Symbol of the data feed's asset.
    // Ex) BTC, ETH, CELO, etc.
    string public symbol;

    // Keeps track of the total number of updates this data feed has made.
    uint256 public numberOfUpdates;

    // Timestamp at which the last update was made.
    uint256 public override lastUpdated;

    // (update index => candlestick info).
    // Starts at index 1.
    mapping (uint256 => Candlestick) public candlesticks;

    // (update index => timestamp at which the update was made).
    mapping (uint256 => uint256) public indexTimestamps;

    /* ========== CONSTRUCTOR ========== */

    constructor(address _dataProvider, address _operator, address _asset, string memory _symbol) {
        dataProvider = _dataProvider;
        operator = _operator;
        asset = _asset;
        symbol = _symbol;
    }

    /* ========== VIEWS ========== */

    /**
    * @notice Gets the current price of the data feed's asset.
    * @dev Current price is the 'close' price of the latest candlestick.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @return uint256 The current USD price.
    */
    function getCurrentPrice() external view override returns (uint256) {
        return getPriceAt(numberOfUpdates);
    }

    /**
    * @notice Gets the price of the data feed's asset at the given index.
    * @dev Index must come before the current index.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @param _index Index in the data feed's history.
    * @return uint256 The USD price at the given index.
    */
    function getPriceAt(uint256 _index) public view override returns (uint256) {
        (,,,, uint256 latestPrice,,) = getCandlestickAt(_index);

        return latestPrice;
    }

    /**
    * @notice Gets the current candlestick of the data feed's asset.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256, uint256) The candlestick index, high price, low price, open price, close price, volume, and starting timestamp.
    */
    function getCurrentCandlestick() external view override returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        return getCandlestickAt(numberOfUpdates);
    }

    /**
    * @notice Gets the candlestick of the data feed's asset at the given index.
    * @dev Index must come before the current index.
    * @dev Price is denominated in USD.
    * @dev Price is scaled to 18 decimals.
    * @param _index Index in the data feed's history.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256, uint256) The candlestick index, high price, low price, open price, close price, volume, and starting timestamp.
    */
    function getCandlestickAt(uint256 _index) public view override returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        // Gas savings.
        Candlestick memory candlestick = candlesticks[_index];

        return (_index, candlestick.high, candlestick.low, candlestick.open, candlestick.close, candlestick.volume, candlestick.startingTimestamp);
    }

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
    * @notice Aggregates the given number of candlesticks into one candlestick, representing a higher timeframe.
    * @dev If there are not enough candlesticks in the data feed's history, the function will aggregate all candlesticks in the data feed's history.
    *      Ex) If user wants to aggregate 60 candlesticks but the data feed only has 50 candlesticks, the function will return a candlestick of size 50 instead of 60.
    * @dev It is not recommended to aggregate more than 10 candlesticks due to gas.
    * @param _numberOfCandlesticks Number of candlesticks to aggregate.
    * @return (uint256, uint256, uint256, uint256, uint256, uint256) High price, low price, open price, close price, total volume, and starting timestamp.
    */
    function aggregateCandleSticks(uint256 _numberOfCandlesticks) external view override returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        require(_numberOfCandlesticks > 1, "CandlestickDataFeed: Number of candlesticks must be greater than 1.");
        require(_numberOfCandlesticks <= MAX_CANDLESTICKS_TO_AGGREGATE, "CandlestickDataFeed: Number of candlesticks cannot be greater than 60.");

        // Gas savings.
        uint256 endingIndex = numberOfUpdates;
        uint256 currentIndex = (endingIndex >= _numberOfCandlesticks) ? endingIndex.sub(_numberOfCandlesticks).add(1) : 1;

        uint256 totalVolume;
        uint256 high;
        uint256 low;
        uint256 startingTimestamp = candlesticks[currentIndex].startingTimestamp;
        uint256 open = candlesticks[currentIndex].open;
        uint256 close = candlesticks[endingIndex].close;

        for (; currentIndex <= endingIndex; currentIndex++) {
            low = (candlesticks[currentIndex].low < low) ? candlesticks[currentIndex].low : low;
            high = (candlesticks[currentIndex].high > high) ? candlesticks[currentIndex].high : high;
            totalVolume = totalVolume.add(candlesticks[currentIndex].volume);
        }

        return (high, low, open, close, totalVolume, startingTimestamp);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @notice Updates the data feed's latest candlestick data with the given data.
    * @dev This function can only be called by the dedicated data provider.
    * @dev Data is based on a 1-minute timeframe.
    * @dev Data is scaled to 18 decimals.
    * @param _high High price for the data feed's asset.
    * @param _low Low price for the data feed's asset.
    * @param _open Starting price for the data feed's asset.
    * @param _close Ending price for the data feed's asset. 
    * @param _volume Number of tokens traded over the last minute.
    * @param _startingTimestamp Timestamp at the start of the candlestick.
    */
    function updateData(uint256 _high, uint256 _low, uint256 _open, uint256 _close, uint256 _volume, uint256 _startingTimestamp) external override onlyDataProvider notHalted {
        // Gas savings.
        uint256 index = numberOfUpdates.add(1);

        numberOfUpdates = index;
        indexTimestamps[index] = block.timestamp;
        lastUpdated = block.timestamp;

        candlesticks[index] = Candlestick({
            index: index,
            high: _high,
            low: _low,
            open: _open,
            close: _close,
            volume: _volume,
            startingTimestamp: _startingTimestamp
        });

        emit UpdatedData(index, _high, _low, _open, _close, _volume, _startingTimestamp);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @notice Updates the address of the data provider allowed to update this data feed.
    * @dev Only the contract operator can call this function.
    * @param _newProvider Address of the new data provider.
    */
    function updateDedicatedDataProvider(address _newProvider) external override onlyOperator {
        require(_newProvider != address(0), "CandlestickDataFeed: Invalid address for _newProvider.");

        dataProvider = _newProvider;

        emit UpdatedDedicatedDataProvider(_newProvider);
    }

    /**
    * @notice Updates the operator of this contract.
    * @dev Only the contract owner can call this function.
    * @param _newOperator Address of the new operator.
    */
    function setOperator(address _newOperator) external override onlyOperator {
        require(_newOperator != address(0), "CandlestickDataFeed: Invalid address for _newOperator.");

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

    /* ========== MODIFIERS ========== */

    modifier onlyOperator() {
        require(msg.sender == operator, "CandlestickDataFeed: Only the operator can call this function.");
        _;
    }

    modifier onlyDataProvider() {
        require(msg.sender == dataProvider, "CandlestickDataFeed: Only the data provider can call this function.");
        _;
    }

    modifier notHalted() {
        require(!isHalted, "CandlestickDataFeed: This function cannot be called when the contract is halted.");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedData(uint256 index, uint256 high, uint256 low, uint256 open, uint256 close, uint256 volume, uint256 startingTimestamp);
    event UpdatedDedicatedDataProvider(address newProvider);
    event SetOperator(address newOperator);
    event HaltDataFeed(bool isHalted);
}