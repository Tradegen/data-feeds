const { ethers } = require("hardhat");

const TGEN_ADDRESS_TESTNET = "";
const TGEN_ADDRESS_MAINNET = "";

const FEE_POOL_ADDRESS_TESTNET = "";
const FEE_POOL_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0xF493F7E4f12f8B24080750D1840B270609aA4757";
const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

const BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "";
const BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

async function registerCandlestickDataFeed(useTestnet, asset, timeframe, dataProvider) {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let address = useTestnet ? CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET : CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET;
    let CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    let candlestickDataFeedRegistry = CandlestickDataFeedRegistryFactory.attach(address);
    
    let tx = await candlestickDataFeedRegistry.registerDataFeed(asset, timeframe, dataProvider);
    await tx.wait();

    let dataFeedAddress = await candlestickDataFeedRegistry.getDataFeedAddress(asset, timeframe);
    console.log("Data feed: " + dataFeedAddress);
}

async function getDataFeedInfo(useTestnet, asset) {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  
  let address = useTestnet ? CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET : CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET;
  let CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
  let candlestickDataFeedRegistry = CandlestickDataFeedRegistryFactory.attach(address);

  let dataFeedAddress = await candlestickDataFeedRegistry.getDataFeedAddress(asset);
  console.log("Data feed: " + dataFeedAddress);

  let info = await candlestickDataFeedRegistry.getDataFeedInfo(asset);
  console.log(info);

  let lastUpdated = await candlestickDataFeedRegistry.lastUpdated(asset);
  console.log(lastUpdated.toString());
}

async function getDataFeedProvider(dataFeedAddress) {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  otherUser = signers[1];
  
  let CandlestickDataFeedFactory = await ethers.getContractFactory('CandlestickDataFeed');
  let candlestickDataFeed = CandlestickDataFeedFactory.attach(dataFeedAddress);

  let provider = await candlestickDataFeed.dataProvider();
  console.log(provider);
}

async function getCurrentCandlestick(useTestnet, asset) {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  
  let address = useTestnet ? CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET : CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET;
  let CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
  let candlestickDataFeedRegistry = CandlestickDataFeedRegistryFactory.attach(address);

  let info = await candlestickDataFeedRegistry.getCurrentCandlestick(asset);
  console.log(info);
}


registerCandlestickDataFeed(true, "BTC", 1440, "0xd0B64C57c4D5AD7a404b057B160e41bfA853dbac")
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
/*
getDataFeedInfo(true, "BTC")
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/
  /*
  getCurrentCandlestick(true, "BTC")
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

getDataFeedProvider("0xC9939E49a47B76fe7632Ede3155414c56DEEa7C2")
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/