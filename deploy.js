const { ethers } = require("hardhat");

const TGEN_ADDRESS_TESTNET = "";
const TGEN_ADDRESS_MAINNET = "";

const FEE_POOL_ADDRESS_TESTNET = "";
const FEE_POOL_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "";
const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

async function deployCandlestickDataFeedRegistry() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    
    let candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    let candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;
    console.log("CandlestickDataFeedRegistry: " + candlestickDataFeedRegistryAddress);
}

async function deployFeePool() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let FeePoolFactory = await ethers.getContractFactory('FeePool');
    
    let feePool = await FeePoolFactory.deploy(deployer.address, TGEN_ADDRESS_TESTNET);
    await feePool.deployed();
    let feePoolAddress = feePool.address;
    console.log("FeePool: " + feePoolAddress);
}

async function deployBotPerformanceDataFeedRegistry() {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    
    let BotPerformanceDataFeedRegistryFactory = await ethers.getContractFactory('BotPerformanceDataFeedRegistry');
    
    let botPerformanceDataFeedRegistry = await BotPerformanceDataFeedRegistryFactory.deploy(FEE_POOL_ADDRESS_TESTNET, CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET, TGEN_ADDRESS_TESTNET);
    await botPerformanceDataFeedRegistry.deployed();
    let botPerformanceDataFeedRegistryAddress = botPerformanceDataFeedRegistry.address;
    console.log("BotPerformanceDataFeedRegistry: " + botPerformanceDataFeedRegistryAddress);
}

deployCandlestickDataFeedRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
/*
deployFeePool()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployBotPerformanceDataFeedRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/