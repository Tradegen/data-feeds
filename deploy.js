const { ethers } = require("hardhat");

const TGEN_ADDRESS_TESTNET = "0xa9e37D0DC17C8B8Ed457Ab7cCC40b5785d4d11C0";
const TGEN_ADDRESS_MAINNET = "";

const FEE_POOL_ADDRESS_TESTNET = "0xa78211CbB829F10C7bca4D2BB83C61F30F70c3e9";
const FEE_POOL_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0x1f19A758382F51811C5D429F30Ad78192C377383";
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
/*
deployCandlestickDataFeedRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployFeePool()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/

deployBotPerformanceDataFeedRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })