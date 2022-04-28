const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("CandlestickDataFeedRegistry", () => {
  let deployer;
  let otherUser;

  let testToken;
  let testTokenAddress;
  let TestTokenFactory;

  let mockDataFeed;
  let dataFeed;
  let dataFeedAddress;
  let DataFeedFactory;

  let registry;
  let registryAddress;
  let RegistryFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TestTokenFactory = await ethers.getContractFactory('TestTokenERC20');
    DataFeedFactory = await ethers.getContractFactory('TestCandlestickDataFeed');
    RegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');

    testToken = await TestTokenFactory.deploy("Test Token", "TEST");
    await testToken.deployed();
    testTokenAddress = testToken.address;

    mockDataFeed = await DataFeedFactory.deploy(otherUser.address, deployer.address, testTokenAddress, "TEST");
    await mockDataFeed.deployed();
  });

  beforeEach(async () => {
    registry = await RegistryFactory.deploy();
    await registry.deployed();
    registryAddress = registry.address;
  });
  
  describe("#registerDataFeed", () => {
    it("onlyRegistrar", async () => {
      let tx = registry.connect(otherUser).registerDataFeed(testTokenAddress, "TEST", otherUser.address);
      await expect(tx).to.be.reverted;

      let numberOfDataFeeds = await registry.numberOfDataFeeds();
      expect(numberOfDataFeeds).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let numberOfDataFeeds = await registry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let hasDataFeed = await registry.hasDataFeed(testTokenAddress);
        expect(hasDataFeed).to.be.true;

        let hasDataFeedFromSymbol = await registry.hasDataFeedFromSymbol("TEST");
        expect(hasDataFeedFromSymbol).to.be.true;
    });

    it("data feed already exists", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let tx2 = registry.registerDataFeed(testTokenAddress, "TEST2", otherUser.address);
        await expect(tx2).to.be.reverted;

        let numberOfDataFeeds = await registry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let hasDataFeed = await registry.hasDataFeed(testTokenAddress);
        expect(hasDataFeed).to.be.true;

        let hasDataFeedFromSymbol = await registry.hasDataFeedFromSymbol("TEST");
        expect(hasDataFeedFromSymbol).to.be.true;
    });
  });

  describe("#setOperator", () => {
    it("onlyOwner", async () => {
      let tx = registry.connect(otherUser).setOperator(otherUser.address);
      await expect(tx).to.be.reverted;

      let operator = await registry.operator();
      expect(operator).to.equal(deployer.address);
    });

    it("meets requirements; no existing data feeds", async () => {
        let tx = await registry.setOperator(otherUser.address);
        await tx.wait();

        let operator = await registry.operator();
        expect(operator).to.equal(otherUser.address);
    });

    it("meets requirements; existing data feeds", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let tx2 = await registry.setOperator(otherUser.address);
        await tx2.wait();

        let operator = await registry.operator();
        expect(operator).to.equal(otherUser.address);

        dataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataFeedOperator = await dataFeed.operator();
        expect(dataFeedOperator).to.equal(otherUser.address);

        let tx3 = registry.haltDataFeed(testTokenAddress, true);
        await expect(tx3).to.be.reverted;

        let isHalted = await dataFeed.isHalted();
        expect(isHalted).to.be.false;

        let tx4 = await dataFeed.connect(otherUser).haltDataFeed(true);
        await tx4.wait();

        let isHalted1 = await dataFeed.isHalted();
        expect(isHalted1).to.be.true;
    });
  });

  describe("#setRegistrar", () => {
    it("onlyOwner", async () => {
      let tx = registry.connect(otherUser).setRegistrar(otherUser.address);
      await expect(tx).to.be.reverted;

      let registrar = await registry.registrar();
      expect(registrar).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await registry.setRegistrar(otherUser.address);
        await tx.wait();

        let registrar = await registry.registrar();
        expect(registrar).to.equal(otherUser.address);
    });
  });
  
  describe("#updateDedicatedDataProvider", () => {
    it("onlyOperator", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).updateDedicatedDataProvider(testTokenAddress, deployer.address);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataProvider = await dataFeed.dataProvider();
        expect(dataProvider).to.equal(otherUser.address);
    });

    it("data feed not found", async () => {
        let tx = registry.updateDedicatedDataProvider(testTokenAddress, deployer.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let tx2 = await registry.updateDedicatedDataProvider(testTokenAddress, deployer.address);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataProvider = await dataFeed.dataProvider();
        expect(dataProvider).to.equal(deployer.address);
    });
  });
  
  describe("#haltDataFeed", () => {
    it("onlyOperator", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).haltDataFeed(testTokenAddress, true);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let isHalted = await dataFeed.isHalted();
        expect(isHalted).to.be.false;
    });

    it("data feed not found", async () => {
        let tx = registry.haltDataFeed(testTokenAddress, true);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let tx2 = await registry.haltDataFeed(testTokenAddress, true);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let isHalted = await dataFeed.isHalted();
        expect(isHalted).to.be.true;

        let status = await dataFeed.getDataFeedStatus();
        expect(status).to.equal(2);
    });
  });
  
  describe("#setDataFeedOperator", () => {
    it("onlyOperator", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).setDataFeedOperator(testTokenAddress, otherUser.address);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let operator = await dataFeed.operator();
        expect(operator).to.equal(registryAddress);
    });

    it("data feed not found", async () => {
        let tx = registry.setDataFeedOperator(testTokenAddress, otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", otherUser.address);
        await tx.wait();

        let tx2 = await registry.setDataFeedOperator(testTokenAddress, otherUser.address);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let operator = await dataFeed.dataProvider();
        expect(operator).to.equal(otherUser.address);
    });
  });
  
  describe("#update data feed and check data feed info", () => {
    it("has correct info", async () => {
        let tx = await registry.registerDataFeed(testTokenAddress, "TEST", deployer.address);
        await tx.wait();
        
        dataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);
        let currentTime = await mockDataFeed.getCurrentTime();

        let tx2 = await dataFeed.updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) + 10);
        await tx2.wait();

        let tx3 = await dataFeed.updateData(parseEther("1.2"), parseEther("1"), parseEther("1.05"), parseEther("1.15"), parseEther("20"), Number(currentTime) + 70);
        await tx3.wait();

        let tx4 = await dataFeed.updateData(parseEther("1.15"), parseEther("0.7"), parseEther("1.15"), parseEther("0.75"), parseEther("50"), Number(currentTime) + 80);
        await tx4.wait();

        let currentPrice = await registry.getCurrentPrice(testTokenAddress);
        expect(currentPrice).to.equal(parseEther("0.75"));

        let currentPriceFromSymbol = await registry.getCurrentPriceFromSymbol("TEST");
        expect(currentPriceFromSymbol).to.equal(currentPrice);

        let priceAt1 = await registry.getPriceAt(testTokenAddress, 1);
        expect(priceAt1).to.equal(parseEther("1.05"));

        let priceAt1FromSymbol = await registry.getPriceAtFromSymbol("TEST", 1);
        expect(priceAt1FromSymbol).to.equal(parseEther("1.05"));

        let priceAt2 = await registry.getPriceAt(testTokenAddress, 2);
        expect(priceAt2).to.equal(parseEther("1.15"));

        let priceAt2FromSymbol = await registry.getPriceAtFromSymbol("TEST", 2);
        expect(priceAt2FromSymbol).to.equal(parseEther("1.15"));

        let priceAt3 = await registry.getPriceAt(testTokenAddress, 3);
        expect(priceAt3).to.equal(parseEther("0.75"));

        let priceAt3FromSymbol = await registry.getPriceAtFromSymbol("TEST", 3);
        expect(priceAt3FromSymbol).to.equal(parseEther("0.75"));

        let currentCandlestick = await registry.getCurrentCandlestick(testTokenAddress);
        expect(currentCandlestick[0]).to.equal(3);
        expect(currentCandlestick[1]).to.equal(parseEther("1.15"));
        expect(currentCandlestick[2]).to.equal(parseEther("0.7"));
        expect(currentCandlestick[3]).to.equal(parseEther("1.15"));
        expect(currentCandlestick[4]).to.equal(parseEther("0.75"));
        expect(currentCandlestick[5]).to.equal(parseEther("50"));
        expect(currentCandlestick[6]).to.equal(Number(currentTime) + 80);

        let currentCandlestickFromSymbol = await registry.getCurrentCandlestickFromSymbol("TEST");
        expect(currentCandlestickFromSymbol[0]).to.equal(currentCandlestick[0]);
        expect(currentCandlestickFromSymbol[1]).to.equal(currentCandlestick[1]);
        expect(currentCandlestickFromSymbol[2]).to.equal(currentCandlestick[2]);
        expect(currentCandlestickFromSymbol[3]).to.equal(currentCandlestick[3]);
        expect(currentCandlestickFromSymbol[4]).to.equal(currentCandlestick[4]);
        expect(currentCandlestickFromSymbol[5]).to.equal(currentCandlestick[5]);
        expect(currentCandlestickFromSymbol[6]).to.equal(currentCandlestick[6]);

        let previousCandlestick = await registry.getCandlestickAt(testTokenAddress, 2);
        expect(previousCandlestick[0]).to.equal(2);
        expect(previousCandlestick[1]).to.equal(parseEther("1.2"));
        expect(previousCandlestick[2]).to.equal(parseEther("1"));
        expect(previousCandlestick[3]).to.equal(parseEther("1.05"));
        expect(previousCandlestick[4]).to.equal(parseEther("1.15"));
        expect(previousCandlestick[5]).to.equal(parseEther("20"));
        expect(previousCandlestick[6]).to.equal(Number(currentTime) + 70);

        let previousCandlestickFromSymbol = await registry.getCandlestickAtFromSymbol("TEST", 2);
        expect(previousCandlestickFromSymbol[0]).to.equal(previousCandlestick[0]);
        expect(previousCandlestickFromSymbol[1]).to.equal(previousCandlestick[1]);
        expect(previousCandlestickFromSymbol[2]).to.equal(previousCandlestick[2]);
        expect(previousCandlestickFromSymbol[3]).to.equal(previousCandlestick[3]);
        expect(previousCandlestickFromSymbol[4]).to.equal(previousCandlestick[4]);
        expect(previousCandlestickFromSymbol[5]).to.equal(previousCandlestick[5]);
        expect(previousCandlestickFromSymbol[6]).to.equal(previousCandlestick[6]);

        let dataFeedInfo = await registry.getDataFeedInfo(testTokenAddress);
        expect(dataFeedInfo[0]).to.equal(dataFeedAddress);
        expect(dataFeedInfo[1]).to.equal(testTokenAddress);
        expect(dataFeedInfo[2]).to.equal(deployer.address);
        expect(dataFeedInfo[3]).to.equal(Number(currentTime));
        expect(dataFeedInfo[4]).to.equal(parseEther("0.75"));

        let dataFeedInfoFromSymbol = await registry.getDataFeedInfoFromSymbol("TEST");
        expect(dataFeedInfoFromSymbol[0]).to.equal(dataFeedInfo[0]);
        expect(dataFeedInfoFromSymbol[1]).to.equal(dataFeedInfo[1]);
        expect(dataFeedInfoFromSymbol[2]).to.equal(dataFeedInfo[2]);
        expect(dataFeedInfoFromSymbol[3]).to.equal(dataFeedInfo[3]);
        expect(dataFeedInfoFromSymbol[4]).to.equal(dataFeedInfo[4]);

        let queriedDataFeedAddress = await registry.getDataFeedAddress(testTokenAddress);
        expect(queriedDataFeedAddress).to.equal(dataFeedAddress);

        let queriedDataFeedAddressFromSymbol = await registry.getDataFeedAddressFromSymbol("TEST");
        expect(queriedDataFeedAddressFromSymbol).to.equal(queriedDataFeedAddress);

        let lastUpdated = await registry.lastUpdated(testTokenAddress);
        expect(lastUpdated).to.equal(Number(currentTime) + 3);

        let lastUpdatedFromSymbol = await registry.lastUpdatedFromSymbol("TEST");
        expect(lastUpdatedFromSymbol).to.equal(lastUpdated);

        let status = await registry.getDataFeedStatus(testTokenAddress);
        expect(status).to.equal(0);

        let statusFromSymbol = await registry.getDataFeedStatusFromSymbol("TEST");
        expect(statusFromSymbol).to.equal(status);

        let invalidStatus = await registry.getDataFeedStatus(deployer.address);
        expect(invalidStatus).to.equal(3);

        let aggregatedCandlestick = await registry.aggregateCandlesticks(testTokenAddress, 3);
        expect(aggregatedCandlestick[0]).to.equal(parseEther("1.2"));
        expect(aggregatedCandlestick[1]).to.equal(parseEther("0.7"));
        expect(aggregatedCandlestick[2]).to.equal(parseEther("1"));
        expect(aggregatedCandlestick[3]).to.equal(parseEther("0.75"));
        expect(aggregatedCandlestick[4]).to.equal(parseEther("80"));
        expect(aggregatedCandlestick[5]).to.equal(Number(currentTime) + 10);

        let aggregatedCandlestickFromSymbol = await registry.aggregateCandlesticksFromSymbol("TEST", 3);
        expect(aggregatedCandlestickFromSymbol[0]).to.equal(aggregatedCandlestick[0]);
        expect(aggregatedCandlestickFromSymbol[1]).to.equal(aggregatedCandlestick[1]);
        expect(aggregatedCandlestickFromSymbol[2]).to.equal(aggregatedCandlestick[2]);
        expect(aggregatedCandlestickFromSymbol[3]).to.equal(aggregatedCandlestick[3]);
        expect(aggregatedCandlestickFromSymbol[4]).to.equal(aggregatedCandlestick[4]);
    });
  });
});