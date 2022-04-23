# Tradegen Data Feeds

Tradegen is an asset management and algo trading platform built on Celo. These smart contracts store 1-minute candlestick data for major cryptos, and the performance of trading bots in simulated trades. The performance of a trading bot is measured as a price that starts at $1.00 and fluctuates based on the bot's lifetime performance. For example, a bot with a lifetime return of +50% will have a $1.50 price and a bot with -30% lifetime return will have a $0.70 price. 

Price data for major cryptos comes from a public API, and is relayed to data feeds once per minute by keeper scripts running on GCP cloud functions. Data feeds for trading bots are updated by the associated trading bot contract whenever the bot makes a simulated trader. Trading bots are updated once per minute by keeper scripts that download the bot's source code as a stringified Python file from IPFS and execute the Python code on GCP cloud functions.

## Disclaimer

These smart contracts have not been audited or deployed yet.

Price data comes from a centralized source and is not checked for quality. Keeper scripts are operated by Tradegen.

## Docs

Docs are available at https://docs.tradegen.io

## License

MIT
