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

    mockDataFeed = await DataFeedFactory.deploy(1, otherUser.address, deployer.address, "TEST");
    await mockDataFeed.deployed();
  });

  beforeEach(async () => {
    registry = await RegistryFactory.deploy();
    await registry.deployed();
    registryAddress = registry.address;
  });
  
  describe("#addValidTimeframe", () => {
    it("onlyOperator", async () => {
      let tx = registry.connect(otherUser).addValidTimeframe(45);
      await expect(tx).to.be.reverted;

      let isAvailable = await registry.availableTimeframes(45);
      expect(isAvailable).to.be.false;
    });

    it("has initial timeframes", async () => {
      let isAvailable1 = await registry.availableTimeframes(1);
      expect(isAvailable1).to.be.true;

      let isAvailable5 = await registry.availableTimeframes(5);
      expect(isAvailable5).to.be.true;

      let isAvailable60 = await registry.availableTimeframes(60);
      expect(isAvailable60).to.be.true;

      let isAvailable1440 = await registry.availableTimeframes(1440);
      expect(isAvailable1440).to.be.true;

      let timeframes = await registry.getValidTimeframes();
      expect(timeframes.length).to.equal(4);
      expect(timeframes[0]).to.equal(1);
      expect(timeframes[1]).to.equal(5);
      expect(timeframes[2]).to.equal(60);
      expect(timeframes[3]).to.equal(1440);
    });

    it("meets requirements", async () => {
      let tx = await registry.addValidTimeframe(30);
      await tx.wait();

      let isAvailable30 = await registry.availableTimeframes(30);
      expect(isAvailable30).to.be.true;

      let timeframes = await registry.getValidTimeframes();
      expect(timeframes.length).to.equal(5);
      expect(timeframes[4]).to.equal(30);
    });
  });
  
  describe("#registerDataFeed", () => {
    it("onlyRegistrar", async () => {
      let tx = registry.connect(otherUser).registerDataFeed("TEST", 1, otherUser.address);
      await expect(tx).to.be.reverted;

      let numberOfDataFeeds = await registry.numberOfDataFeeds();
      expect(numberOfDataFeeds).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let numberOfDataFeeds = await registry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let hasDataFeed = await registry.hasDataFeed("TEST", 1);
        expect(hasDataFeed).to.be.true;
    });

    it("data feed already exists", async () => {
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let tx2 = registry.registerDataFeed("TEST", 1, otherUser.address);
        await expect(tx2).to.be.reverted;

        let numberOfDataFeeds = await registry.numberOfDataFeeds();
        expect(numberOfDataFeeds).to.equal(1);

        let hasDataFeed = await registry.hasDataFeed("TEST", 1);
        expect(hasDataFeed).to.be.true;
    });

    it("same asset with multiple timeframes", async () => {
      let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
      await tx.wait();

      let tx2 = await registry.registerDataFeed("TEST", 5, otherUser.address);
      await tx2.wait();

      let numberOfDataFeeds = await registry.numberOfDataFeeds();
      expect(numberOfDataFeeds).to.equal(2);

      let hasDataFeed1 = await registry.hasDataFeed("TEST", 1);
      expect(hasDataFeed1).to.be.true;

      let hasDataFeed5 = await registry.hasDataFeed("TEST", 5);
      expect(hasDataFeed5).to.be.true;
    });

    it("different assets with same timeframe", async () => {
      let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
      await tx.wait();

      let tx2 = await registry.registerDataFeed("CELO", 1, otherUser.address);
      await tx2.wait();

      let numberOfDataFeeds = await registry.numberOfDataFeeds();
      expect(numberOfDataFeeds).to.equal(2);

      let hasDataFeed1 = await registry.hasDataFeed("TEST", 1);
      expect(hasDataFeed1).to.be.true;

      let hasDataFeed2 = await registry.hasDataFeed("CELO", 1);
      expect(hasDataFeed2).to.be.true;
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
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let tx2 = await registry.setOperator(otherUser.address);
        await tx2.wait();

        let operator = await registry.operator();
        expect(operator).to.equal(otherUser.address);

        dataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataFeedOperator = await dataFeed.operator();
        expect(dataFeedOperator).to.equal(otherUser.address);

        let tx3 = registry.haltDataFeed("TEST", 1, true);
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
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).updateDedicatedDataProvider("TEST", 1, deployer.address);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataProvider = await dataFeed.dataProvider();
        expect(dataProvider).to.equal(otherUser.address);
    });

    it("data feed not found", async () => {
        let tx = registry.updateDedicatedDataProvider("TEST", 1, deployer.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let tx2 = await registry.updateDedicatedDataProvider("TEST", 1, deployer.address);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let dataProvider = await dataFeed.dataProvider();
        expect(dataProvider).to.equal(deployer.address);
    });
  });
  
  describe("#haltDataFeed", () => {
    it("onlyOperator", async () => {
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).haltDataFeed("TEST", 1, true);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let isHalted = await dataFeed.isHalted();
        expect(isHalted).to.be.false;
    });

    it("data feed not found", async () => {
        let tx = registry.haltDataFeed("TEST", 1, true);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let tx2 = await registry.haltDataFeed("TEST", 1, true);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let isHalted = await dataFeed.isHalted();
        expect(isHalted).to.be.true;

        let status = await dataFeed.getDataFeedStatus();
        expect(status).to.equal(2);
    });
  });
  
  describe("#setDataFeedOperator", () => {
    it("onlyOperator", async () => {
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let tx2 = registry.connect(otherUser).setDataFeedOperator("TEST", 1, otherUser.address);
        await expect(tx2).to.be.reverted;

        dataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let operator = await dataFeed.operator();
        expect(operator).to.equal(registryAddress);
    });

    it("data feed not found", async () => {
        let tx = registry.setDataFeedOperator("TEST", 1, otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await registry.registerDataFeed("TEST", 1, otherUser.address);
        await tx.wait();

        let tx2 = await registry.setDataFeedOperator("TEST", 1, otherUser.address);
        await tx2.wait();

        dataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);

        let operator = await dataFeed.dataProvider();
        expect(operator).to.equal(otherUser.address);
    });
  });
  
  describe("#update data feed and check data feed info", () => {
    it("has correct info", async () => {
        let tx = await registry.registerDataFeed("TEST", 1, deployer.address);
        await tx.wait();
        
        dataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        dataFeed = DataFeedFactory.attach(dataFeedAddress);
        let currentTime = await mockDataFeed.getCurrentTime();
        
        let tx2 = await dataFeed.updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let currentPrice = await registry.getCurrentPrice("TEST", 1);
        expect(currentPrice).to.equal(parseEther("1.05"));

        let priceAt1 = await registry.getPriceAt("TEST", 1, 1);
        expect(priceAt1).to.equal(parseEther("1.05"));

        let currentCandlestick = await registry.getCurrentCandlestick("TEST", 1);
        expect(currentCandlestick[0]).to.equal(1);
        expect(currentCandlestick[1]).to.equal(parseEther("1.1"));
        expect(currentCandlestick[2]).to.equal(parseEther("0.9"));
        expect(currentCandlestick[3]).to.equal(parseEther("1"));
        expect(currentCandlestick[4]).to.equal(parseEther("1.05"));
        expect(currentCandlestick[5]).to.equal(parseEther("10"));
        expect(currentCandlestick[6]).to.equal(Number(currentTime) - 10);

        let dataFeedInfo = await registry.getDataFeedInfo("TEST", 1);
        expect(dataFeedInfo[0]).to.equal(dataFeedAddress);
        expect(dataFeedInfo[1]).to.equal("TEST");
        expect(dataFeedInfo[2]).to.equal(deployer.address);
        expect(dataFeedInfo[3]).to.equal(Number(currentTime));
        expect(dataFeedInfo[4]).to.equal(parseEther("1.05"));
        
        let queriedDataFeedAddress = await registry.getDataFeedAddress("TEST", 1);
        expect(queriedDataFeedAddress).to.equal(dataFeedAddress);

        let lastUpdated = await registry.lastUpdated("TEST", 1);
        expect(lastUpdated).to.equal(Number(currentTime) - 10);

        let status = await registry.getDataFeedStatus("TEST", 1);
        expect(status).to.equal(0);

        let invalidStatus = await registry.getDataFeedStatus("CELO", 1);
        expect(invalidStatus).to.equal(3);

        let canUpdate = await registry.canUpdate("TEST", 1);
        expect(canUpdate).to.be.false;
    });
  });
});