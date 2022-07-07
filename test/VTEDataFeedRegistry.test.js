const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
const { factoryAbi } = require("@ubeswap/solidity-create2-deployer");

describe("VTEDataFeedRegistry", () => {
  let deployer;
  let otherUser;

  let testToken;
  let testTokenAddress;
  let feeToken;
  let feeTokenAddress;
  let TokenFactory;
  
  let VTE;
  let VTEAddress;
  let VTEFactory;

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

  let VTEDataFeed;
  let VTEDataFeedAddress;
  let VTEDataFeedFactory;

  let VTEDataFeedFactoryContract;
  let VTEDataFeedFactoryContractAddress;
  let VTEDataFeedFactoryFactory;

  let VTEDataFeedRegistry;
  let VTEDataFeedRegistryAddress;
  let VTEDataFeedRegistryFactory;

  let utils;
  let utilsAddress;
  let UtilsFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    UtilsFactory = await ethers.getContractFactory('Utils');
    utils = await UtilsFactory.deploy();
    await utils.deployed();
    utilsAddress = utils.address;

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    VTEFactory = await ethers.getContractFactory('TestVirtualTradingEnvironment');
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
    VTEDataFeedRegistryFactory = await ethers.getContractFactory('VTEDataFeedRegistry');

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

    testToken = await TokenFactory.deploy("Test Token", "TEST");
    await testToken.deployed();
    testTokenAddress = testToken.address;

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    VTE = await VTEFactory.deploy(otherUser.address);
    await VTE.deployed();
    VTEAddress = VTE.address;

    feePool = await FeePoolFactory.deploy(deployer.address, feeTokenAddress);
    await feePool.deployed();
    feePoolAddress = feePool.address;

    dataSource = await DataSourceFactory.deploy(candlestickDataFeedRegistryAddress);
    await dataSource.deployed();
    dataSourceAddress = dataSource.address;

    oracle = await OracleFactory.deploy(dataSourceAddress);
    await oracle.deployed();
    oracleAddress = oracle.address;

    VTEDataFeedFactoryContract = await VTEDataFeedFactoryFactory.deploy(oracleAddress, feePoolAddress, feeTokenAddress);
    await VTEDataFeedFactoryContract.deployed();
    VTEDataFeedFactoryContractAddress = VTEDataFeedFactoryContract.address;
  });

  beforeEach(async () => {
    VTEDataFeedRegistry = await VTEDataFeedRegistryFactory.deploy(feePoolAddress, feeTokenAddress, oracleAddress, VTEDataFeedFactoryContractAddress);
    await VTEDataFeedRegistry.deployed();
    VTEDataFeedRegistryAddress = VTEDataFeedRegistry.address;

    let tx = await VTEDataFeedFactoryContract.initializeContract(VTEDataFeedRegistryAddress);
    await tx.wait();
  });
  
  describe("#registerDataFeed", () => {
    it("onlyRegistrar", async () => {
      let tx = VTEDataFeedRegistry.connect(otherUser).registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
      await expect(tx).to.be.reverted;

      let numberOfDataFeeds = await VTEDataFeedRegistry.numberOfDataFeeds();
      expect(numberOfDataFeeds).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
        await tx.wait();

        VTEDataFeedAddress = await VTEDataFeedRegistry.dataFeeds(VTEAddress);

        let numberOfDataFeeds = await VTEDataFeedRegistry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let usageFeeToken = await VTEDataFeedRegistry.usageFeeToken(VTEAddress);
        expect(usageFeeToken).to.equal(feeTokenAddress);

        let usageFee = await VTEDataFeedRegistry.usageFee(VTEAddress);
        expect(usageFee).to.equal(parseEther("1"));

        let dataFeedInfo = await VTEDataFeedRegistry.getDataFeedInfo(VTEAddress);
        expect(dataFeedInfo[0]).to.equal(VTEDataFeedAddress);
        expect(dataFeedInfo[1]).to.equal(VTEAddress);
        expect(dataFeedInfo[2]).to.equal(otherUser.address);
        expect(dataFeedInfo[3]).to.equal(VTEAddress);
        expect(dataFeedInfo[4]).to.equal(parseEther("1"));
    });

    it("data feed already exists", async () => {
        let tx = await VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("2"), deployer.address);
        await expect(tx2).to.be.reverted;

        let numberOfDataFeeds = await VTEDataFeedRegistry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);
    });
  });

  describe("#setOperator", () => {
    it("onlyOwner", async () => {
      let tx = VTEDataFeedRegistry.connect(otherUser).setOperator(otherUser.address);
      await expect(tx).to.be.reverted;

      let operator = await VTEDataFeedRegistry.operator();
      expect(operator).to.equal(deployer.address);
    });

    it("meets requirements; no existing data feeds", async () => {
        let tx = await VTEDataFeedRegistry.setOperator(otherUser.address);
        await tx.wait();

        let operator = await VTEDataFeedRegistry.operator();
        expect(operator).to.equal(otherUser.address);
    });

    it("meets requirements; existing data feeds", async () => {
        let tx = await VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await VTEDataFeedRegistry.setOperator(otherUser.address);
        await tx2.wait();

        let operator = await VTEDataFeedRegistry.operator();
        expect(operator).to.equal(otherUser.address);

        VTEDataFeedAddress = await VTEDataFeedRegistry.dataFeeds(VTEAddress);
        VTEDataFeed = VTEDataFeedFactory.attach(VTEDataFeedAddress);

        let dataFeedOperator = await VTEDataFeed.operator();
        expect(dataFeedOperator).to.equal(otherUser.address);
    });
  });

  describe("#setRegistrar", () => {
    it("onlyOwner", async () => {
      let tx = VTEDataFeedRegistry.connect(otherUser).setRegistrar(otherUser.address);
      await expect(tx).to.be.reverted;

      let registrar = await VTEDataFeedRegistry.registrar();
      expect(registrar).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await VTEDataFeedRegistry.setRegistrar(otherUser.address);
        await tx.wait();

        let registrar = await VTEDataFeedRegistry.registrar();
        expect(registrar).to.equal(otherUser.address);
    });
  });
  
  describe("#updateDedicatedDataProvider", () => {
    it("onlyOperator", async () => {
        let tx = await VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = VTEDataFeedRegistry.connect(otherUser).updateDedicatedDataProvider(VTEAddress, otherUser.address);
        await expect(tx2).to.be.reverted;

        VTEDataFeedAddress = await VTEDataFeedRegistry.dataFeeds(VTEAddress);
        VTEDataFeed = VTEDataFeedFactory.attach(VTEDataFeedAddress);

        let dataProvider = await VTEDataFeed.dataProvider();
        expect(dataProvider).to.equal(VTEAddress);
    });

    it("data feed not found", async () => {
        let tx = VTEDataFeedRegistry.updateDedicatedDataProvider(testTokenAddress, deployer.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await VTEDataFeedRegistry.updateDedicatedDataProvider(VTEAddress, otherUser.address);
        await tx2.wait();

        VTEDataFeedAddress = await VTEDataFeedRegistry.dataFeeds(VTEAddress);
        VTEDataFeed = VTEDataFeedFactory.attach(VTEDataFeedAddress);

        let dataProvider = await VTEDataFeed.dataProvider();
        expect(dataProvider).to.equal(otherUser.address);
    });
  });
  
  describe("#setDataFeedOperator", () => {
    it("onlyOperator", async () => {
        let tx = await VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = VTEDataFeedRegistry.connect(otherUser).setDataFeedOperator(VTEAddress, otherUser.address);
        await expect(tx2).to.be.reverted;

        VTEDataFeedAddress = await VTEDataFeedRegistry.dataFeeds(VTEAddress);
        VTEDataFeed = VTEDataFeedFactory.attach(VTEDataFeedAddress);

        let operator = await VTEDataFeed.operator();
        expect(operator).to.equal(VTEDataFeedRegistryAddress);
    });

    it("data feed not found", async () => {
        let tx = VTEDataFeedRegistry.setDataFeedOperator(VTEAddress, otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await VTEDataFeedRegistry.setDataFeedOperator(VTEAddress, otherUser.address);
        await tx2.wait();

        VTEDataFeedAddress = await VTEDataFeedRegistry.dataFeeds(VTEAddress);
        VTEDataFeed = VTEDataFeedFactory.attach(VTEDataFeedAddress);

        let operator = await VTEDataFeed.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });

  describe("#getTokenPrice", () => {
    it("data feed not found", async () => {
        let tx = VTEDataFeedRegistry.getTokenPrice(VTEAddress);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await VTEDataFeedRegistry.registerDataFeed(VTEAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await feeToken.approve(VTEDataFeedRegistryAddress, parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeedRegistry.getTokenPrice(VTEAddress);
        await tx3.wait();

        VTEDataFeedAddress = await VTEDataFeedRegistry.dataFeeds(VTEAddress);
        VTEDataFeed = VTEDataFeedFactory.attach(VTEDataFeedAddress);

        let balanceDataFeedRegistry = await feeToken.balanceOf(VTEDataFeedRegistryAddress);
        expect(balanceDataFeedRegistry).to.equal(0);

        let balanceFeePool = await feeToken.balanceOf(feePoolAddress);
        expect(balanceFeePool).to.equal(parseEther("1"));

        let availableFees = await feePool.availableFees(otherUser.address);
        expect(availableFees).to.equal(parseEther("1"));
    });
  });
});