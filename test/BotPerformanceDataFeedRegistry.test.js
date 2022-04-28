const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("BotPerformanceDataFeedRegistry", () => {
  let deployer;
  let otherUser;

  let testToken;
  let testTokenAddress;
  let feeToken;
  let feeTokenAddress;
  let TokenFactory;
  
  let tradingBot;
  let tradingBotAddress;
  let TradingBotFactory;

  let feePool;
  let feePoolAddress;
  let FeePoolFactory;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let mockBotPerformanceDataFeed;
  let botPerformanceDataFeed;
  let botPerformanceDataFeedAddress;
  let BotPerformanceDataFeedFactory;

  let botPerformanceDataFeedRegistry;
  let botPerformanceDataFeedRegistryAddress;
  let BotPerformanceDataFeedRegistryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    TradingBotFactory = await ethers.getContractFactory('TestTradingBot');
    FeePoolFactory = await ethers.getContractFactory('FeePool');
    CandlestickDataFeedFactory = await ethers.getContractFactory('TestCandlestickDataFeed');
    RegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    BotPerformanceDataFeedFactory = await ethers.getContractFactory('TestBotPerformanceDataFeed');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    BotPerformanceDataFeedRegistryFactory = await ethers.getContractFactory('BotPerformanceDataFeedRegistry');

    testToken = await TokenFactory.deploy("Test Token", "TEST");
    await testToken.deployed();
    testTokenAddress = testToken.address;

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    tradingBot = await TradingBotFactory.deploy(otherUser.address);
    await tradingBot.deployed();
    tradingBotAddress = tradingBot.address;

    feePool = await FeePoolFactory.deploy(deployer.address, feeTokenAddress);
    await feePool.deployed();
    feePoolAddress = feePool.address;

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

    mockBotPerformanceDataFeed = await BotPerformanceDataFeedFactory.deploy(deployer.address, deployer.address, feePoolAddress, candlestickDataFeedRegistryAddress, tradingBotAddress, feeTokenAddress, parseEther("1"));
    await mockBotPerformanceDataFeed.deployed();
    mockBotPerformanceDataFeedAddress = mockBotPerformanceDataFeed.address;
  });

  beforeEach(async () => {
    botPerformanceDataFeedRegistry = await BotPerformanceDataFeedRegistryFactory.deploy(feePoolAddress, candlestickDataFeedRegistryAddress, feeTokenAddress);
    await botPerformanceDataFeedRegistry.deployed();
    botPerformanceDataFeedRegistryAddress = botPerformanceDataFeedRegistry.address;
  });
  
  describe("#registerDataFeed", () => {
    it("onlyRegistrar", async () => {
      let tx = botPerformanceDataFeedRegistry.connect(otherUser).registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
      await expect(tx).to.be.reverted;

      let numberOfDataFeeds = await botPerformanceDataFeedRegistry.numberOfDataFeeds();
      expect(numberOfDataFeeds).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let numberOfDataFeeds = await botPerformanceDataFeedRegistry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let hasDataFeed = await botPerformanceDataFeedRegistry.hasDataFeed(tradingBotAddress);
        expect(hasDataFeed).to.be.true;
    });

    it("data feed already exists", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("2"), deployer.address);
        await expect(tx2).to.be.reverted;

        let numberOfDataFeeds = await botPerformanceDataFeedRegistry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let hasDataFeed = await botPerformanceDataFeedRegistry.hasDataFeed(tradingBotAddress);
        expect(hasDataFeed).to.be.true;
    });
  });

  describe("#setOperator", () => {
    it("onlyOwner", async () => {
      let tx = botPerformanceDataFeedRegistry.connect(otherUser).setOperator(otherUser.address);
      await expect(tx).to.be.reverted;

      let operator = await botPerformanceDataFeedRegistry.operator();
      expect(operator).to.equal(deployer.address);
    });

    it("meets requirements; no existing data feeds", async () => {
        let tx = await botPerformanceDataFeedRegistry.setOperator(otherUser.address);
        await tx.wait();

        let operator = await botPerformanceDataFeedRegistry.operator();
        expect(operator).to.equal(otherUser.address);
    });

    it("meets requirements; existing data feeds", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await botPerformanceDataFeedRegistry.setOperator(otherUser.address);
        await tx2.wait();

        let operator = await botPerformanceDataFeedRegistry.operator();
        expect(operator).to.equal(otherUser.address);

        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);

        let dataFeedOperator = await botPerformanceDataFeed.operator();
        expect(dataFeedOperator).to.equal(otherUser.address);

        let tx3 = botPerformanceDataFeedRegistry.haltDataFeed(tradingBotAddress, true);
        await expect(tx3).to.be.reverted;

        let isHalted = await botPerformanceDataFeed.isHalted();
        expect(isHalted).to.be.false;

        let tx4 = await botPerformanceDataFeed.connect(otherUser).haltDataFeed(true);
        await tx4.wait();

        let isHalted1 = await botPerformanceDataFeed.isHalted();
        expect(isHalted1).to.be.true;
    });
  });

  describe("#setRegistrar", () => {
    it("onlyOwner", async () => {
      let tx = botPerformanceDataFeedRegistry.connect(otherUser).setRegistrar(otherUser.address);
      await expect(tx).to.be.reverted;

      let registrar = await botPerformanceDataFeedRegistry.registrar();
      expect(registrar).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeedRegistry.setRegistrar(otherUser.address);
        await tx.wait();

        let registrar = await botPerformanceDataFeedRegistry.registrar();
        expect(registrar).to.equal(otherUser.address);
    });
  });
  
  describe("#updateDedicatedDataProvider", () => {
    it("onlyOperator", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = botPerformanceDataFeedRegistry.connect(otherUser).updateDedicatedDataProvider(tradingBotAddress, otherUser.address);
        await expect(tx2).to.be.reverted;

        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);

        let dataProvider = await botPerformanceDataFeed.dataProvider();
        expect(dataProvider).to.equal(deployer.address);
    });

    it("data feed not found", async () => {
        let tx = botPerformanceDataFeedRegistry.updateDedicatedDataProvider(testTokenAddress, deployer.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await botPerformanceDataFeedRegistry.updateDedicatedDataProvider(tradingBotAddress, otherUser.address);
        await tx2.wait();

        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);

        let dataProvider = await botPerformanceDataFeed.dataProvider();
        expect(dataProvider).to.equal(otherUser.address);
    });
  });
  
  describe("#haltDataFeed", () => {
    it("onlyOperator", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = botPerformanceDataFeedRegistry.connect(otherUser).haltDataFeed(tradingBotAddress, true);
        await expect(tx2).to.be.reverted;

        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);

        let isHalted = await botPerformanceDataFeed.isHalted();
        expect(isHalted).to.be.false;
    });

    it("data feed not found", async () => {
        let tx = botPerformanceDataFeedRegistry.haltDataFeed(tradingBotAddress, true);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await botPerformanceDataFeedRegistry.haltDataFeed(tradingBotAddress, true);
        await tx2.wait();

        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);

        let isHalted = await botPerformanceDataFeed.isHalted();
        expect(isHalted).to.be.true;

        let status = await botPerformanceDataFeed.getDataFeedStatus();
        expect(status).to.equal(2);
    });
  });
  
  describe("#setDataFeedOperator", () => {
    it("onlyOperator", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = botPerformanceDataFeedRegistry.connect(otherUser).setDataFeedOperator(tradingBotAddress, otherUser.address);
        await expect(tx2).to.be.reverted;

        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);

        let operator = await botPerformanceDataFeed.operator();
        expect(operator).to.equal(botPerformanceDataFeedRegistryAddress);
    });

    it("data feed not found", async () => {
        let tx = botPerformanceDataFeedRegistry.setDataFeedOperator(tradingBotAddress, otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await botPerformanceDataFeedRegistry.setDataFeedOperator(tradingBotAddress, otherUser.address);
        await tx2.wait();

        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);

        let operator = await botPerformanceDataFeed.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });

  describe("#getTokenPrice", () => {
    it("data feed not found", async () => {
        let tx = botPerformanceDataFeedRegistry.getTokenPrice(tradingBotAddress);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();

        let tx2 = await feeToken.approve(botPerformanceDataFeedRegistryAddress, parseEther("1"));
        await tx2.wait();

        let tx3 = await botPerformanceDataFeedRegistry.getTokenPrice(tradingBotAddress);
        await tx3.wait();

        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);

        let balanceDataFeedRegistry = await feeToken.balanceOf(botPerformanceDataFeedRegistryAddress);
        expect(balanceDataFeedRegistry).to.equal(0);

        let balanceFeePool = await feeToken.balanceOf(feePoolAddress);
        expect(balanceFeePool).to.equal(parseEther("1"));

        let availableFees = await feePool.availableFees(otherUser.address);
        expect(availableFees).to.equal(parseEther("1"));
    });
  });
  
  describe("#update data feed and check data feed info", () => {
    it("has correct info", async () => {
        let tx = await botPerformanceDataFeedRegistry.registerDataFeed(tradingBotAddress, parseEther("1"), deployer.address);
        await tx.wait();
        
        botPerformanceDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        botPerformanceDataFeed = BotPerformanceDataFeedFactory.attach(botPerformanceDataFeedAddress);
        let currentTime = await mockBotPerformanceDataFeed.getCurrentTime();

        let tx2 = await botPerformanceDataFeed.updateData(testTokenAddress, false, parseEther("1"), 1000);
        await tx2.wait();

        let usageFeeToken = await botPerformanceDataFeedRegistry.usageFeeToken(tradingBotAddress);
        expect(usageFeeToken).to.equal(feeTokenAddress);

        let usageFee = await botPerformanceDataFeedRegistry.usageFee(tradingBotAddress);
        expect(usageFee).to.equal(parseEther("1"));

        let dataFeedInfo = await botPerformanceDataFeedRegistry.getDataFeedInfo(tradingBotAddress);
        expect(dataFeedInfo[0]).to.equal(botPerformanceDataFeedAddress);
        expect(dataFeedInfo[1]).to.equal(tradingBotAddress);
        expect(dataFeedInfo[2]).to.equal(otherUser.address);
        expect(dataFeedInfo[3]).to.equal(deployer.address);
        expect(dataFeedInfo[4]).to.equal(parseEther("1"));

        let queriedDataFeedAddress = await botPerformanceDataFeedRegistry.getDataFeedAddress(tradingBotAddress);
        expect(queriedDataFeedAddress).to.equal(botPerformanceDataFeedAddress);

        let lastUpdated = await botPerformanceDataFeedRegistry.lastUpdated(tradingBotAddress);
        expect(lastUpdated).to.equal(Number(currentTime) + 1);

        let status = await botPerformanceDataFeedRegistry.getDataFeedStatus(tradingBotAddress);
        expect(status).to.equal(0);

        let hasDataFeed = await botPerformanceDataFeedRegistry.hasDataFeed(tradingBotAddress);
        expect(hasDataFeed).to.be.true;

        let orderInfo = await botPerformanceDataFeedRegistry.getOrderInfo(tradingBotAddress, 1);
        expect(orderInfo[0]).to.equal(testTokenAddress);
        expect(orderInfo[1]).to.be.false;
        expect(orderInfo[2]).to.equal(1000);
        expect(orderInfo[3]).to.equal(parseEther("1"));
    });
  });
});