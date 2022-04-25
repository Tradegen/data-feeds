const { ethers } = require("hardhat");

const TGEN_ADDRESS_TESTNET = "";
const TGEN_ADDRESS_MAINNET = "";

const FEE_POOL_ADDRESS_TESTNET = "";
const FEE_POOL_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "";
const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

const BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "";
const BOT_PERFORMANCE_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

async function registerCandlestickDataFeed(useTestnet, asset, symbol, dataProvider) {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let address = useTestnet ? CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET : CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET;
    let CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    let candlestickDataFeedRegistry = CandlestickDataFeedRegistryFactory.attach(address);
    
    let tx = await candlestickDataFeedRegistry.registerDataFeed(asset, symbol, dataProvider);
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
}

registerCandlestickDataFeed()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
/*
getDataFeedAddress()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/