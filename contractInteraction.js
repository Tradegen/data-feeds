const { ethers } = require("hardhat");

const TGEN_ADDRESS_TESTNET = "";
const TGEN_ADDRESS_MAINNET = "";

const FEE_POOL_ADDRESS_TESTNET = "";
const FEE_POOL_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0x92AB4188FEFA45520DE79215e9Bc106D41a1Db54";
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

registerCandlestickDataFeed(true, "BTC", "0xd0B64C57c4D5AD7a404b057B160e41bfA853dbac")
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
getDataFeedProvider("0xC9939E49a47B76fe7632Ede3155414c56DEEa7C2")
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/