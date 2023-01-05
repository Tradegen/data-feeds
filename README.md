# Tradegen Data Feeds

## Purpose

Create a decentralized API for candlestick data for major cryptos, the performance of trading bots in simulated trades, and the performance of virtual trading environments (VTEs). 

## System Design

### Candlestick Data

Price data for major cryptos comes from a public API and is relayed to data feeds once per minute by keeper scripts running on GCP cloud functions. Each crypto has one or more timeframes (1-minute, 5-minute, 1-hour, or 1-day). The data is aggregated into candlesticks containing the open price, close price, high price, low price, and volume over the timeframe. 

### Trading Bot Performance Data

Data feeds for trading bots are updated by the associated trading bot contract whenever the bot makes a simulated trade. Trading bots are updated once per minute by keeper scripts that call the trading bot contract with the latest oracle data.

The performance of a trading bot is measured as a price that starts at $1.00 and fluctuates based on the bot's lifetime performance. For example, a bot with a lifetime return of +50% will have a $1.50 price and a bot with -30% lifetime return will have a $0.70 price. 

### VTE Performance Data

Data feeds for VTEs are updated by the associated VTE contract whenever the VTE owner makes a simulated trade. Unlike trading bots, VTEs are not maintained by keepers; instead, they are updated manually by the VTE owner. 

The performance of a VTE is measured similarly to that of a trading bot.

### Smart Contracts

* BotPerformanceDataFeed - Tracks the lifetime performance of a trading bot.
* BotPerformanceDataFeedRegistry - Creates/tracks BotPerformanceDataFeed contracts and provides a function for requesting data from a BotPerformanceDataFeed.
* CandlestickDataFeed - Aggregates the price data of a major crypto into a candlestick.
* CandlestickDataFeedRegistry - Creates/tracks CandlestickDataFeed contracts and provides a function for requesting data from a CandlestickDataFeed.
* FeePool - Stores 'data usage' fees collected by BotPerformanceDataFeeds and VTEDataFeeds.
* VTEDataFeed - Tracks the lifetime performance of a virtual trading environment.
* VTEDataFeedFactory - Creates a VTEDataFeed contract when registering a VTE data feed.
* VTEDataFeedRegistry - Creates/Tracks VTEDataFeeds and provides a function for requesting data from a VTEDataFeed.

## Disclaimer

These smart contracts  have not been audited yet.

Candlestick price data comes from a centralized source and is not checked for quality. Keeper scripts are operated by Tradegen.

## Documentation

To learn more about the Tradegen project, visit the docs at https://docs.tradegen.io.

This protocol is launched on the Celo blockchain. To learn more about Celo, visit their home page: https://celo.org/.

Source code for trading bots: https://github.com/Tradegen/algo-trading.

Source code for virtual trading environments (VTE): https://github.com/Tradegen/virtual-trading-environments.

## License

MIT
