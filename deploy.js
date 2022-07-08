const { ethers } = require("hardhat");

const TGEN_ADDRESS_TESTNET = "0xa9e37D0DC17C8B8Ed457Ab7cCC40b5785d4d11C0";
const TGEN_ADDRESS_MAINNET = "";

const FEE_POOL_ADDRESS_TESTNET = "0xa78211CbB829F10C7bca4D2BB83C61F30F70c3e9";
const FEE_POOL_ADDRESS_MAINNET = "";

const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0x1f19A758382F51811C5D429F30Ad78192C377383";
const CANDLESTICK_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

const ORACLE_ADDRESS_TESTNET = "0xFD174a7467db999B34A8AA7aB3EAd47020091385";
const ORACLE_ADDRESS_MAINNET = "";

const FACTORY_ADDRESS_TESTNET = "0x32bEA7eEe68fdA9a0d4e7FA8d63b13d6011e32A7";
const FACTORY_ADDRESS_MAINNET = "";

const VTE_DATA_FEED_REGISTRY_ADDRESS_TESTNET = "0xD5ac9fBe8Ae711bf228Ed9a9B9B76D6731808dD5";
const VTE_DATA_FEED_REGISTRY_ADDRESS_MAINNET = "";

const UTILS_LIBRARY_ADDRESS_TESTNET = "0xc151f6658738E875cEc2E59dd6a3064181FE4d7D";
const UTILS_LIBRARY_ADDRESS_MAINNET = "";

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

async function deployUtilsLibrary() {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  
  let UtilsFactory = await ethers.getContractFactory('Utils');
  utils = await UtilsFactory.deploy();
  await utils.deployed();
  console.log("Utils Library: " + utils.address);
}

async function deployVTEDataFeedFactory() {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  
  let VTEDataFeedFactoryFactory = await ethers.getContractFactory('VTEDataFeedFactory', {
    libraries: {
        Utils: UTILS_LIBRARY_ADDRESS_TESTNET,
    },
  });
  
  let VTEDataFeedFactory = await VTEDataFeedFactoryFactory.deploy(ORACLE_ADDRESS_TESTNET, FEE_POOL_ADDRESS_TESTNET, TGEN_ADDRESS_TESTNET);
  await VTEDataFeedFactory.deployed();
  let VTEDataFeedFactoryAddress = VTEDataFeedFactory.address;
  console.log("VTEDataFeedFactory: " + VTEDataFeedFactoryAddress);
}

async function deployVTEDataFeedRegistry() {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  
  let VTEDataFeedRegistryFactory = await ethers.getContractFactory('VTEDataFeedRegistry');
  
  let VTEDataFeedRegistry = await VTEDataFeedRegistryFactory.deploy(FEE_POOL_ADDRESS_TESTNET, TGEN_ADDRESS_TESTNET, ORACLE_ADDRESS_TESTNET, FACTORY_ADDRESS_TESTNET);
  await VTEDataFeedRegistry.deployed();
  let VTEDataFeedRegistryAddress = VTEDataFeedRegistry.address;
  console.log("VTEDataFeedRegistry: " + VTEDataFeedRegistryAddress);
}

async function setRegistry() {
  const signers = await ethers.getSigners();
  deployer = signers[0];
  
  let VTEDataFeedFactoryFactory = await ethers.getContractFactory('VTEDataFeedFactory', {
    libraries: {
        Utils: UTILS_LIBRARY_ADDRESS_TESTNET,
    },
  });
  let factory = VTEDataFeedFactoryFactory.attach(FACTORY_ADDRESS_TESTNET);
  
  let tx = await factory.initializeContract(VTE_DATA_FEED_REGISTRY_ADDRESS_TESTNET);
  await tx.wait();

  let registry = await factory.VTEDataFeedRegistry();
  console.log(registry);
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
  })

deployBotPerformanceDataFeedRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployUtilsLibrary()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployVTEDataFeedFactory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

deployVTEDataFeedRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })*/

setRegistry()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })