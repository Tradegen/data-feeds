const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("VTEDataFeedFactory", () => {
  let deployer;
  let otherUser;

  let VTEDataFeedFactoryContract;
  let VTEDataFeedFactoryContractAddress;
  let VTEDataFeedFactoryFactory;

  let VTEDataFeed;
  let VTEDataFeedAddress;
  let VTEDataFeedFactory;

  let utils;
  let utilsAddress;
  let UtilsFactory;

  let feePool;
  let feePoolAddress;
  let FeePoolFactory;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let dataSource;
  let dataSourceAddress;
  let DataSourceFactory;

  let oracle;
  let oracleAddress;
  let OracleFactory;

  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  before(async () => {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    otherUser = signers[1];

    UtilsFactory = await ethers.getContractFactory('Utils');
    utils = await UtilsFactory.deploy();
    await utils.deployed();
    utilsAddress = utils.address;

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    FeePoolFactory = await ethers.getContractFactory('FeePool');
    DataSourceFactory = await ethers.getContractFactory('TradegenCandlestickDataSource');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    OracleFactory = await ethers.getContractFactory('Oracle');
    RegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    VTEDataFeedFactory = await ethers.getContractFactory('VTEDataFeed', {
        libraries: {
            Utils: utilsAddress,
        },
      });
    VTEDataFeedFactoryFactory = await ethers.getContractFactory('VTEDataFeedFactory', {
      libraries: {
          Utils: utilsAddress,
      },
    });

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

    feePool = await FeePoolFactory.deploy(deployer.address, feeTokenAddress);
    await feePool.deployed();
    feePoolAddress = feePool.address;

    dataSource = await DataSourceFactory.deploy(candlestickDataFeedRegistryAddress);
    await dataSource.deployed();
    dataSourceAddress = dataSource.address;

    oracle = await OracleFactory.deploy(dataSourceAddress);
    await oracle.deployed();
    oracleAddress = oracle.address;
  });

  beforeEach(async () => {
    VTEDataFeedFactoryContract = await VTEDataFeedFactoryFactory.deploy(oracleAddress, feePoolAddress, feeTokenAddress);
    await VTEDataFeedFactoryContract.deployed();
    VTEDataFeedFactoryContractAddress = VTEDataFeedFactoryContract.address;
  });

  describe("#initializeContract", () => {
    it("onlyOwner", async () => {
        let tx = VTEDataFeedFactoryContract.connect(otherUser).initializeContract(otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
      let tx = await VTEDataFeedFactoryContract.initializeContract(otherUser.address);
      await tx.wait();

      let registry = await VTEDataFeedFactoryContract.VTEDataFeedRegistry();
      expect(registry).to.equal(otherUser.address);
    });
  });

  describe("#createVTEDataFeed", () => {
    it("onlyVTEDataFeedRegistry", async () => {
        let tx = await VTEDataFeedFactoryContract.initializeContract(deployer.address);
        await tx.wait();

        let tx2 = VTEDataFeedFactoryContract.connect(otherUser).createVTEDataFeed(otherUser.address, parseEther("1"));
        await expect(tx2).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await VTEDataFeedFactoryContract.initializeContract(deployer.address);
        await tx.wait();

        let tx2 = await VTEDataFeedFactoryContract.createVTEDataFeed(otherUser.address, parseEther("1"));
        let temp = await tx2.wait();
        let event = temp.events[temp.events.length - 1];
        VTEDataFeedAddress = event.args.VTEDataFeed;
        VTEDataFeed = VTEDataFeedFactory.attach(VTEDataFeedAddress);

        let operator = await VTEDataFeed.operator();
        expect(operator).to.equal(deployer.address);
    });
  });
});