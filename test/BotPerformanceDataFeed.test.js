const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("BotPerformanceDataFeedRegistry", () => {
  let deployer;
  let otherUser;

  let testToken;
  let testTokenAddress;
  let feeToken;
  let feeTokenAddress;
  let TokenFactory;

  let candlestickDataFeed;
  let candlestickDataFeedAddress;
  let CandlestickDataFeedFactory;

  let tradingBot;
  let tradingBotAddress;
  let TradingBotFactory;

  let feePool;
  let feePoolAddress;
  let FeePoolFactory;

  let candlestickDataFeedRegistry;
  let candlestickDataFeedRegistryAddress;
  let CandlestickDataFeedRegistryFactory;

  let botPerformanceDataFeed;
  let botPerformanceDataFeedAddress;
  let BotPerformanceDataFeedFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    TradingBotFactory = await ethers.getContractFactory('TestTradingBot');
    FeePoolFactory = await ethers.getContractFactory('FeePool');
    CandlestickDataFeedFactory = await ethers.getContractFactory('TestCandlestickDataFeed');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    BotPerformanceDataFeedFactory = await ethers.getContractFactory('TestBotPerformanceDataFeed');

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
  });

  beforeEach(async () => {
    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

    botPerformanceDataFeed = await BotPerformanceDataFeedFactory.deploy(deployer.address, deployer.address, feePoolAddress, candlestickDataFeedRegistryAddress, tradingBotAddress, feeTokenAddress, parseEther("1"));
    await botPerformanceDataFeed.deployed();
    botPerformanceDataFeedAddress = botPerformanceDataFeed.address;
  });
  
  describe("#setOperator", () => {
    it("onlyOperator", async () => {
      let tx = botPerformanceDataFeed.connect(otherUser).setOperator(otherUser.address);
      await expect(tx).to.be.reverted;

      let operator = await botPerformanceDataFeed.operator();
      expect(operator).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeed.setOperator(otherUser.address);
        await tx.wait();

        let operator = await botPerformanceDataFeed.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });
  
  describe("#updateDedicatedDataProvider", () => {
    it("onlyOperator", async () => {
        let tx = botPerformanceDataFeed.connect(otherUser).updateDedicatedDataProvider(otherUser.address);
        await expect(tx).to.be.reverted;

        let dataProvider = await botPerformanceDataFeed.dataProvider();
        expect(dataProvider).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeed.updateDedicatedDataProvider(otherUser.address);
        await tx.wait();

        let dataProvider = await botPerformanceDataFeed.dataProvider();
        expect(dataProvider).to.equal(otherUser.address);
    });
  });
  
  describe("#haltDataFeed", () => {
    it("onlyOperator", async () => {
        let tx = botPerformanceDataFeed.connect(otherUser).haltDataFeed(true);
        await expect(tx).to.be.reverted;

        let isHalted = await botPerformanceDataFeed.isHalted();
        expect(isHalted).to.be.false;
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeed.haltDataFeed(true);
        await tx.wait();

        let isHalted = await botPerformanceDataFeed.isHalted();
        expect(isHalted).to.be.true;
    });
  });

  describe("#updateUsageFee", () => {
    it("onlyTradingBotOwner", async () => {
        let tx = botPerformanceDataFeed.updateUsageFee(parseEther("1.1"));
        await expect(tx).to.be.reverted;

        let usageFee = await botPerformanceDataFeed.usageFee();
        expect(usageFee).to.equal(parseEther("1"));
    });

    it("greater than max usage fee", async () => {
        let tx = botPerformanceDataFeed.connect(otherUser).updateUsageFee(parseEther("10000"));
        await expect(tx).to.be.reverted;

        let usageFee = await botPerformanceDataFeed.usageFee();
        expect(usageFee).to.equal(parseEther("1"));
    });

    it("greater than max fee increase", async () => {
        let tx = botPerformanceDataFeed.connect(otherUser).updateUsageFee(parseEther("1.3"));
        await expect(tx).to.be.reverted;

        let usageFee = await botPerformanceDataFeed.usageFee();
        expect(usageFee).to.equal(parseEther("1"));
    });

    it("meets requirements", async () => {
        let tx = await botPerformanceDataFeed.connect(otherUser).updateUsageFee(parseEther("1.1"));
        await tx.wait();

        let usageFee = await botPerformanceDataFeed.usageFee();
        expect(usageFee).to.equal(parseEther("1.1"));
    });

    it("not enough time between updates", async () => {
        let tx = await botPerformanceDataFeed.connect(otherUser).updateUsageFee(parseEther("1.1"));
        await tx.wait();

        let tx2 = botPerformanceDataFeed.connect(otherUser).updateUsageFee(parseEther("1.2"));
        await expect(tx2).to.be.reverted;

        let usageFee = await botPerformanceDataFeed.usageFee();
        expect(usageFee).to.equal(parseEther("1.1"));
    });
  });

  describe("#calculateTokenPrice", () => {
    it("no updates", async () => {
        let price = await botPerformanceDataFeed.calculateTokenPrice();
        expect(price).to.equal(parseEther("1"));

        let isHalted = await botPerformanceDataFeed.isHalted();
        expect(isHalted).to.be.false;
    });

    it("latest order is sell", async () => {
        let tx = await botPerformanceDataFeed.setNumberOfUpdates(1);
        await tx.wait();

        let tx2 = await botPerformanceDataFeed.setOrder(1, testTokenAddress, false, 1000, parseEther("1"), parseEther("2"));
        await tx2.wait();

        let price = await botPerformanceDataFeed.calculateTokenPrice();
        expect(price).to.equal(parseEther("2"));
    });

    it("latest order is buy; price is up", async () => {
        let tx = await botPerformanceDataFeed.setNumberOfUpdates(1);
        await tx.wait();

        let tx2 = await candlestickDataFeedRegistry.registerDataFeed(testTokenAddress, "TEST", deployer.address);
        await tx2.wait();

        candlestickDataFeedAddress = await candlestickDataFeedRegistry.getDataFeedAddress(testTokenAddress);
        candlestickDataFeed = CandlestickDataFeedFactory.attach(candlestickDataFeedAddress);
        let currentTime = await botPerformanceDataFeed.getCurrentTime();

        let tx3 = await candlestickDataFeed.updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.1"), parseEther("10"), Number(currentTime) + 10);
        await tx3.wait();

        let tx4 = await botPerformanceDataFeed.setOrder(1, testTokenAddress, true, 1000, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let price = await botPerformanceDataFeed.calculateTokenPrice();
        expect(price).to.equal(parseEther("1.1"));
    });

    it("latest order is buy; price is down", async () => {
        let tx = await botPerformanceDataFeed.setNumberOfUpdates(1);
        await tx.wait();

        let tx2 = await candlestickDataFeedRegistry.registerDataFeed(testTokenAddress, "TEST", deployer.address);
        await tx2.wait();

        candlestickDataFeedAddress = await candlestickDataFeedRegistry.getDataFeedAddress(testTokenAddress);
        candlestickDataFeed = CandlestickDataFeedFactory.attach(candlestickDataFeedAddress);
        let currentTime = await botPerformanceDataFeed.getCurrentTime();

        let tx3 = await candlestickDataFeed.updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("0.9"), parseEther("10"), Number(currentTime) + 10);
        await tx3.wait();

        let tx4 = await botPerformanceDataFeed.setOrder(1, testTokenAddress, true, 1000, parseEther("1.8"), parseEther("1"));
        await tx4.wait();

        let price = await botPerformanceDataFeed.calculateTokenPrice();
        expect(price).to.equal(parseEther("0.5"));
    });
  });
  
  describe("#getTokenPrice", () => {
    it("get token price", async () => {
        let tx = await feeToken.approve(botPerformanceDataFeedAddress, parseEther("1"));
        await tx.wait();

        let tx2 = await botPerformanceDataFeed.getTokenPrice();
        expect(tx2).to.emit(botPerformanceDataFeed, "GetTokenPrice");
        await tx2.wait();

        let balanceDataFeed = await feeToken.balanceOf(botPerformanceDataFeedAddress);
        expect(balanceDataFeed).to.equal(0);

        let balanceFeePool = await feeToken.balanceOf(feePoolAddress);
        expect(balanceFeePool).to.equal(parseEther("1"));

        let availableFees = await feePool.availableFees(otherUser.address);
        expect(availableFees).to.equal(parseEther("1"));
    });
  });

  describe("#updateData", () => {
    it("onlyDataProvider", async () => {
      let tx = botPerformanceDataFeed.connect(otherUser).updateData(testTokenAddress, true, parseEther("1"), 1000);
      await expect(tx).to.be.reverted;

      let numberOfUpdates = await botPerformanceDataFeed.numberOfUpdates();
      expect(numberOfUpdates).to.equal(0);
    });

    it("is not halted", async () => {
        let tx = await botPerformanceDataFeed.haltDataFeed(true);
        await tx.wait();

        let tx2 = botPerformanceDataFeed.updateData(testTokenAddress, true, parseEther("1"), 1000);
        await expect(tx2).to.be.reverted;

        let numberOfUpdates = await botPerformanceDataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(0);
    });

    it("meets requirements", async () => {
        let currentTime = await botPerformanceDataFeed.getCurrentTime();

        let tx = await botPerformanceDataFeed.updateData(testTokenAddress, true, parseEther("1"), 1000);
        await tx.wait();
  
        let numberOfUpdates = await botPerformanceDataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(1);

        let lastUpdated = await botPerformanceDataFeed.lastUpdated();
        expect(lastUpdated).to.equal(Number(currentTime) + 1);

        let indexTimestamp = await botPerformanceDataFeed.indexTimestamps(1);
        expect(indexTimestamp).to.equal(Number(currentTime) + 1);

        let orderInfo = await botPerformanceDataFeed.getOrderInfo(1);
        expect(orderInfo[0]).to.equal(testTokenAddress);
        expect(orderInfo[1]).to.be.true;
        expect(orderInfo[2]).to.equal(1000);
        expect(orderInfo[3]).to.equal(parseEther("1"));

        let status = await botPerformanceDataFeed.getDataFeedStatus();
        expect(status).to.equal(0);
    });
  });
  
  describe("#getDataFeedStatus", () => {
    it("halted", async () => {
        let tx = await botPerformanceDataFeed.haltDataFeed(true);
        await tx.wait();

        let status = await botPerformanceDataFeed.getDataFeedStatus();
        expect(status).to.equal(2);
    });

    it("outdated", async () => {
        let currentTime = await botPerformanceDataFeed.getCurrentTime();

        let tx = await botPerformanceDataFeed.setLastUpdated(Number(currentTime) - 1000);
        await tx.wait();

        let status = await botPerformanceDataFeed.getDataFeedStatus();
        expect(status).to.equal(1);
    });

    it("active", async () => {
        let currentTime = await botPerformanceDataFeed.getCurrentTime();

        let tx = await botPerformanceDataFeed.setLastUpdated(Number(currentTime) - 10);
        await tx.wait();

        let status = await botPerformanceDataFeed.getDataFeedStatus();
        expect(status).to.equal(0);
    });
  });
});*/