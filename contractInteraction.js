const { ethers } = require("hardhat");

const TGEN_ADDRESS_TESTNET = "";
const TGEN_ADDRESS_MAINNET = "";

const FEE_POOL_ADDRESS_TESTNET = "";
const FEE_POOL_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0x1f9736a5a7aEF3ba7FF55d6a2c66F1Ec0eb5FAd7";
const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

const BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "";
const BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

async function registerCandlestickDataFeed(useTestnet, asset, dataProvider) {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let address = useTestnet ? CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET : CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET;
    let CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    let candlestickDataFeedRegistry = CandlestickDataFeedRegistryFactory.attach(address);
    
    let tx = await candlestickDataFeedRegistry.registerDataFeed(asset, dataProvider);
    await tx.wait();

    let dataFeedAddress = await candlestickDataFeedRegistry.getDataFeedAddress(asset);
    console.log("Data feed: " + dataFeedAddress);
}

async function getDataFeedAddress(useTestnet, asset) {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  
  let address = useTestnet ? CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET : CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET;
  let CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
  let candlestickDataFeedRegistry = CandlestickDataFeedRegistryFactory.attach(address);

  let dataFeedAddress = await candlestickDataFeedRegistry.getDataFeedAddress(asset);
  console.log("Data feed: " + dataFeedAddress);

  let info = await candlestickDataFeedRegistry.getDataFeedInfo(asset);
  console.log(info);
}

/*registerCandlestickDataFeed(true, "BTC", "0xd0B64C57c4D5AD7a404b057B160e41bfA853dbac")
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/

getDataFeedAddress(true, "BTC")
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })