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

    mockDataFeed = await DataFeedFactory.deploy(otherUser.address, deployer.address, "TEST");
    await mockDataFeed.deployed();
  });

  beforeEach(async () => {
    registry = await RegistryFactory.deploy();
    await registry.deployed();
    registryAddress = registry.address;
  });
  
  describe("#registerDataFeed", () => {
    it("onlyRegistrar", async () => {
      let tx = registry.connect(otherUser).registerDataFeed("TEST", otherUser.address);
      await expect(tx).to.be.reverted;

      let numberOfDataFeeds = await registry.numberOfDataFeeds();
      expect(numberOfDataFeeds).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let numberOfDataFeeds = await registry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let hasDataFeed = await registry.hasDataFeed("TEST");
        expect(hasDataFeed).to.be.true;
    });

    it("data feed already exists", async () => {
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let tx2 = registry.registerDataFeed("TEST", otherUser.address);
        await expect(tx2).to.be.reverted;

        let numberOfDataFeeds = await registry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let hasDataFeed = await registry.hasDataFeed("TEST");
        expect(hasDataFeed).to.be.true;
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
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let tx2 = await registry.setOperator(otherUser.address);
        await tx2.wait();

        let operator = await registry.operator();
        expect(operator).to.equal(otherUser.address);

        dataFeedAddress = await registry.getDataFeedAddress("TEST");
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataFeedOperator = await dataFeed.operator();
        expect(dataFeedOperator).to.equal(otherUser.address);

        let tx3 = registry.haltDataFeed("TEST", true);
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
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).updateDedicatedDataProvider("TEST", deployer.address);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress("TEST");
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataProvider = await dataFeed.dataProvider();
        expect(dataProvider).to.equal(otherUser.address);
    });

    it("data feed not found", async () => {
        let tx = registry.updateDedicatedDataProvider("TEST", deployer.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let tx2 = await registry.updateDedicatedDataProvider("TEST", deployer.address);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress("TEST");
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataProvider = await dataFeed.dataProvider();
        expect(dataProvider).to.equal(deployer.address);
    });
  });
  
  describe("#haltDataFeed", () => {
    it("onlyOperator", async () => {
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).haltDataFeed("TEST", true);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress("TEST");
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let isHalted = await dataFeed.isHalted();
        expect(isHalted).to.be.false;
    });

    it("data feed not found", async () => {
        let tx = registry.haltDataFeed("TEST", true);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let tx2 = await registry.haltDataFeed("TEST", true);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress("TEST");
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let isHalted = await dataFeed.isHalted();
        expect(isHalted).to.be.true;

        let status = await dataFeed.getDataFeedStatus();
        expect(status).to.equal(2);
    });
  });
  
  describe("#setDataFeedOperator", () => {
    it("onlyOperator", async () => {
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).setDataFeedOperator("TEST", otherUser.address);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress("TEST");
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let operator = await dataFeed.operator();
        expect(operator).to.equal(registryAddress);
    });

    it("data feed not found", async () => {
        let tx = registry.setDataFeedOperator("TEST", otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed("TEST", otherUser.address);
        await tx.wait();

        let tx2 = await registry.setDataFeedOperator("TEST", otherUser.address);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress("TEST");
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let operator = await dataFeed.dataProvider();
        expect(operator).to.equal(otherUser.address);
    });
  });
  
  describe("#update data feed and check data feed info", () => {
    it("has correct info", async () => {
        let tx = await registry.registerDataFeed("TEST", deployer.address);
        await tx.wait();
        
        dataFeedAddress = await registry.getDataFeedAddress("TEST");
        dataFeed = DataFeedFactory.attach(dataFeedAddress);
        let currentTime = await mockDataFeed.getCurrentTime();

        let tx2 = await dataFeed.updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) + 10);
        await tx2.wait();

        let tx3 = await dataFeed.updateData(parseEther("1.2"), parseEther("1"), parseEther("1.05"), parseEther("1.15"), parseEther("20"), Number(currentTime) + 70);
        await tx3.wait();

        let tx4 = await dataFeed.updateData(parseEther("1.15"), parseEther("0.7"), parseEther("1.15"), parseEther("0.75"), parseEther("50"), Number(currentTime) + 80);
        await tx4.wait();

        let currentPrice = await registry.getCurrentPrice("TEST");
        expect(currentPrice).to.equal(parseEther("0.75"));

        let priceAt1 = await registry.getPriceAt("TEST", 1);
        expect(priceAt1).to.equal(parseEther("1.05"));

        let priceAt2 = await registry.getPriceAt("TEST", 2);
        expect(priceAt2).to.equal(parseEther("1.15"));

        let priceAt3 = await registry.getPriceAt("TEST", 3);
        expect(priceAt3).to.equal(parseEther("0.75"));

        let currentCandlestick = await registry.getCurrentCandlestick("TEST");
        expect(currentCandlestick[0]).to.equal(3);
        expect(currentCandlestick[1]).to.equal(parseEther("1.15"));
        expect(currentCandlestick[2]).to.equal(parseEther("0.7"));
        expect(currentCandlestick[3]).to.equal(parseEther("1.15"));
        expect(currentCandlestick[4]).to.equal(parseEther("0.75"));
        expect(currentCandlestick[5]).to.equal(parseEther("50"));
        expect(currentCandlestick[6]).to.equal(Number(currentTime) + 80);

        let previousCandlestick = await registry.getCandlestickAt("TEST", 2);
        expect(previousCandlestick[0]).to.equal(2);
        expect(previousCandlestick[1]).to.equal(parseEther("1.2"));
        expect(previousCandlestick[2]).to.equal(parseEther("1"));
        expect(previousCandlestick[3]).to.equal(parseEther("1.05"));
        expect(previousCandlestick[4]).to.equal(parseEther("1.15"));
        expect(previousCandlestick[5]).to.equal(parseEther("20"));
        expect(previousCandlestick[6]).to.equal(Number(currentTime) + 70);

        let dataFeedInfo = await registry.getDataFeedInfo("TEST");
        expect(dataFeedInfo[0]).to.equal(dataFeedAddress);
        expect(dataFeedInfo[1]).to.equal("TEST");
        expect(dataFeedInfo[2]).to.equal(deployer.address);
        expect(dataFeedInfo[3]).to.equal(Number(currentTime));
        expect(dataFeedInfo[4]).to.equal(parseEther("0.75"));

        let queriedDataFeedAddress = await registry.getDataFeedAddress("TEST");
        expect(queriedDataFeedAddress).to.equal(dataFeedAddress);

        let lastUpdated = await registry.lastUpdated("TEST");
        expect(lastUpdated).to.equal(Number(currentTime) + 3);

        let status = await registry.getDataFeedStatus("TEST");
        expect(status).to.equal(0);

        let invalidStatus = await registry.getDataFeedStatus(deployer.address);
        expect(invalidStatus).to.equal(3);

        let aggregatedCandlestick = await registry.aggregateCandlesticks("TEST", 3);
        expect(aggregatedCandlestick[0]).to.equal(parseEther("1.2"));
        expect(aggregatedCandlestick[1]).to.equal(parseEther("0.7"));
        expect(aggregatedCandlestick[2]).to.equal(parseEther("1"));
        expect(aggregatedCandlestick[3]).to.equal(parseEther("0.75"));
        expect(aggregatedCandlestick[4]).to.equal(parseEther("80"));
        expect(aggregatedCandlestick[5]).to.equal(Number(currentTime) + 10);
    });
  });
});