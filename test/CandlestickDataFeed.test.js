const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");
/*
describe("CandlestickDataFeed", () => {
  let deployer;
  let otherUser;

  let testToken;
  let testTokenAddress;
  let TestTokenFactory;

  let dataFeed;
  let dataFeedAddress;
  let DataFeedFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    TestTokenFactory = await ethers.getContractFactory('TestTokenERC20');
    DataFeedFactory = await ethers.getContractFactory('TestCandlestickDataFeed');

    testToken = await TestTokenFactory.deploy("Test Token", "TEST");
    await testToken.deployed();
    testTokenAddress = testToken.address;
  });

  beforeEach(async () => {
    dataFeed = await DataFeedFactory.deploy(1, otherUser.address, deployer.address, "TEST");
    await dataFeed.deployed();
    dataFeedAddress = dataFeed.address;
  });
  
  describe("#setOperator", () => {
    it("onlyOwner", async () => {
      let tx = dataFeed.connect(otherUser).setOperator(otherUser.address);
      await expect(tx).to.be.reverted;

      let operator = await dataFeed.operator();
      expect(operator).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await dataFeed.setOperator(otherUser.address);
        await tx.wait();

        let operator = await dataFeed.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });

  describe("#updateDedicatedDataProvider", () => {
    it("onlyOperator", async () => {
      let tx = dataFeed.connect(otherUser).updateDedicatedDataProvider(deployer.address);
      await expect(tx).to.be.reverted;

      let dataProvider = await dataFeed.dataProvider();
      expect(dataProvider).to.equal(otherUser.address);
    });

    it("meets requirements", async () => {
        let tx = await dataFeed.updateDedicatedDataProvider(deployer.address);
        await tx.wait();

        let dataProvider = await dataFeed.dataProvider();
        expect(dataProvider).to.equal(deployer.address);
    });
  });

  describe("#haltDataFeed", () => {
    it("onlyOperator", async () => {
      let tx = dataFeed.connect(otherUser).haltDataFeed(true);
      await expect(tx).to.be.reverted;

      let isHalted = await dataFeed.isHalted();
      expect(isHalted).to.be.false;
    });

    it("meets requirements", async () => {
        let tx = await dataFeed.haltDataFeed(true);
        await tx.wait();

        let isHalted = await dataFeed.isHalted();
        expect(isHalted).to.be.true;
    });
  });

  describe("#canUpdate", () => {
    it("no existing updates; 1-minute timeframe", async () => {
        let canUpdate = await dataFeed.canUpdate();
        expect(canUpdate).to.be.true;
    });

    it("meets requirements; 1-minute timeframe", async () => {
      let currentTime = await dataFeed.getCurrentTime();

      let tx = await dataFeed.setLastUpdated(Number(currentTime) - 70);
      await tx.wait();

      let canUpdate = await dataFeed.canUpdate();
      expect(canUpdate).to.be.true;
    });

    it("not enough time between updates; 1-minute timeframe", async () => {
      let currentTime = await dataFeed.getCurrentTime();

      let tx = await dataFeed.setLastUpdated(Number(currentTime) - 20);
      await tx.wait();

      let canUpdate = await dataFeed.canUpdate();
      expect(canUpdate).to.be.false;
    });

    it("meets requirements; 5-minute timeframe", async () => {
      dataFeed = await DataFeedFactory.deploy(5, otherUser.address, deployer.address, "TEST");
      await dataFeed.deployed();
      dataFeedAddress = dataFeed.address;

      let currentTime = await dataFeed.getCurrentTime();

      let tx = await dataFeed.setLastUpdated(Number(currentTime) - 370);
      await tx.wait();

      let canUpdate = await dataFeed.canUpdate();
      expect(canUpdate).to.be.true;
    });

    it("not enough time between updates; 5-minute timeframe", async () => {
      dataFeed = await DataFeedFactory.deploy(5, otherUser.address, deployer.address, "TEST");
      await dataFeed.deployed();
      dataFeedAddress = dataFeed.address;

      let currentTime = await dataFeed.getCurrentTime();

      let tx = await dataFeed.setLastUpdated(Number(currentTime) - 70);
      await tx.wait();

      let canUpdate = await dataFeed.canUpdate();
      expect(canUpdate).to.be.false;
    });
  });

  describe("#updateDataFeed", () => {
    it("onlyDataProvider", async () => {
      let currentTime = await dataFeed.getCurrentTime();

      let tx = dataFeed.updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime));
      await expect(tx).to.be.reverted;

      let numberOfUpdates = await dataFeed.numberOfUpdates();
      expect(numberOfUpdates).to.equal(0);

      let lastUpdated = await dataFeed.lastUpdated();
      expect(lastUpdated).to.equal(0);
    });

    it("not halted", async () => {
        let tx = await dataFeed.haltDataFeed(true);
        await tx.wait();

        let currentTime = await dataFeed.getCurrentTime();

        let tx2 = dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime));
        await expect(tx2).to.be.reverted;

        let numberOfUpdates = await dataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(0);

        let lastUpdated = await dataFeed.lastUpdated();
        expect(lastUpdated).to.equal(0);
    });
    
    it("meets requirements; no existing candlesticks", async () => {
        let currentTime = await dataFeed.getCurrentTime();
  
        let tx = await dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime));
        await tx.wait();
  
        let numberOfUpdates = await dataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(1);
  
        let lastUpdated = await dataFeed.lastUpdated();
        expect(lastUpdated).to.equal(Number(currentTime));

        let indexTimestamp = await dataFeed.getIndexTimestamp(1);
        expect(indexTimestamp).to.equal(Number(currentTime));

        let currentPrice = await dataFeed.getCurrentPrice();
        expect(currentPrice).to.equal(parseEther("1.05"));

        let priceAt1 = await dataFeed.getPriceAt(1);
        expect(priceAt1).to.equal(parseEther("1.05"));

        // Out of bounds.
        let priceAt2 = await dataFeed.getPriceAt(2);
        expect(priceAt2).to.equal(0);

        let currentCandlestick = await dataFeed.getCurrentCandlestick();
        expect(currentCandlestick[0]).to.equal(1);
        expect(currentCandlestick[1]).to.equal(parseEther("1.1"));
        expect(currentCandlestick[2]).to.equal(parseEther("0.9"));
        expect(currentCandlestick[3]).to.equal(parseEther("1"));
        expect(currentCandlestick[4]).to.equal(parseEther("1.05"));
        expect(currentCandlestick[5]).to.equal(parseEther("10"));
        expect(currentCandlestick[6]).to.equal(Number(currentTime));

        // Out of bounds.
        let invalidCandlestick = await dataFeed.getCandlestickAt(5);
        expect(invalidCandlestick[0]).to.equal(5);
        expect(invalidCandlestick[1]).to.equal(0);
        expect(invalidCandlestick[2]).to.equal(0);
        expect(invalidCandlestick[3]).to.equal(0);
        expect(invalidCandlestick[4]).to.equal(0);
        expect(invalidCandlestick[5]).to.equal(0);
        expect(invalidCandlestick[6]).to.equal(0);
    });

    it("starting timestamp must be before current timestamp", async () => {
        let currentTime = await dataFeed.getCurrentTime();
  
        let tx = await dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) - 100);
        await tx.wait();

        let tx2 = dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) + 10);
        await expect(tx2).to.be.reverted;
  
        let numberOfUpdates = await dataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(1);
  
        let lastUpdated = await dataFeed.lastUpdated();
        expect(lastUpdated).to.equal(Number(currentTime) - 100);

        let indexTimestamp = await dataFeed.getIndexTimestamp(1);
        expect(indexTimestamp).to.equal(Number(currentTime) - 100);

        let currentPrice = await dataFeed.getCurrentPrice();
        expect(currentPrice).to.equal(parseEther("1.05"));

        let priceAt1 = await dataFeed.getPriceAt(1);
        expect(priceAt1).to.equal(parseEther("1.05"));

        // Out of bounds.
        let priceAt2 = await dataFeed.getPriceAt(2);
        expect(priceAt2).to.equal(0);

        let currentCandlestick = await dataFeed.getCurrentCandlestick();
        expect(currentCandlestick[0]).to.equal(1);
        expect(currentCandlestick[1]).to.equal(parseEther("1.1"));
        expect(currentCandlestick[2]).to.equal(parseEther("0.9"));
        expect(currentCandlestick[3]).to.equal(parseEther("1"));
        expect(currentCandlestick[4]).to.equal(parseEther("1.05"));
        expect(currentCandlestick[5]).to.equal(parseEther("10"));
        expect(currentCandlestick[6]).to.equal(Number(currentTime) - 100);

        // Out of bounds.
        let invalidCandlestick = await dataFeed.getCandlestickAt(2);
        expect(invalidCandlestick[0]).to.equal(2);
        expect(invalidCandlestick[1]).to.equal(0);
        expect(invalidCandlestick[2]).to.equal(0);
        expect(invalidCandlestick[3]).to.equal(0);
        expect(invalidCandlestick[4]).to.equal(0);
        expect(invalidCandlestick[5]).to.equal(0);
        expect(invalidCandlestick[6]).to.equal(0);
    });

    it("not enough time between updates", async () => {
      let currentTime = await dataFeed.getCurrentTime();

      let tx = await dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) - 50);
      await tx.wait();

      let tx2 = dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) - 10);
      await expect(tx2).to.be.reverted;

      let numberOfUpdates = await dataFeed.numberOfUpdates();
      expect(numberOfUpdates).to.equal(1);

      let lastUpdated = await dataFeed.lastUpdated();
      expect(lastUpdated).to.equal(Number(currentTime) - 50);

      let indexTimestamp = await dataFeed.getIndexTimestamp(1);
      expect(indexTimestamp).to.equal(Number(currentTime) - 50);

      let currentPrice = await dataFeed.getCurrentPrice();
      expect(currentPrice).to.equal(parseEther("1.05"));

      let priceAt1 = await dataFeed.getPriceAt(1);
      expect(priceAt1).to.equal(parseEther("1.05"));

      // Out of bounds.
      let priceAt2 = await dataFeed.getPriceAt(2);
      expect(priceAt2).to.equal(0);

      let currentCandlestick = await dataFeed.getCurrentCandlestick();
      expect(currentCandlestick[0]).to.equal(1);
      expect(currentCandlestick[1]).to.equal(parseEther("1.1"));
      expect(currentCandlestick[2]).to.equal(parseEther("0.9"));
      expect(currentCandlestick[3]).to.equal(parseEther("1"));
      expect(currentCandlestick[4]).to.equal(parseEther("1.05"));
      expect(currentCandlestick[5]).to.equal(parseEther("10"));
      expect(currentCandlestick[6]).to.equal(Number(currentTime) - 50);

      // Out of bounds.
      let invalidCandlestick = await dataFeed.getCandlestickAt(2);
      expect(invalidCandlestick[0]).to.equal(2);
      expect(invalidCandlestick[1]).to.equal(0);
      expect(invalidCandlestick[2]).to.equal(0);
      expect(invalidCandlestick[3]).to.equal(0);
      expect(invalidCandlestick[4]).to.equal(0);
      expect(invalidCandlestick[5]).to.equal(0);
      expect(invalidCandlestick[6]).to.equal(0);
  });

    it("meets requirements; existing candlesticks", async () => {
        let currentTime = await dataFeed.getCurrentTime();
  
        let tx = await dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await dataFeed.setLastUpdated(Number(currentTime) - 70);
        await tx2.wait();

        let tx3 = await dataFeed.connect(otherUser).updateData(parseEther("1.2"), parseEther("1"), parseEther("1.05"), parseEther("1.15"), parseEther("20"), Number(currentTime) - 7);
        await tx3.wait();
  
        let numberOfUpdates = await dataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(2);
  
        let lastUpdated = await dataFeed.lastUpdated();
        expect(lastUpdated).to.equal(Number(currentTime) - 7);

        let indexTimestamp1 = await dataFeed.getIndexTimestamp(1);
        expect(indexTimestamp1).to.equal(Number(currentTime) - 10);

        let indexTimestamp2 = await dataFeed.getIndexTimestamp(2);
        expect(indexTimestamp2).to.equal(Number(currentTime) - 7);

        let currentPrice = await dataFeed.getCurrentPrice();
        expect(currentPrice).to.equal(parseEther("1.15"));

        let priceAt1 = await dataFeed.getPriceAt(1);
        expect(priceAt1).to.equal(parseEther("1.05"));

        let priceAt2 = await dataFeed.getPriceAt(2);
        expect(priceAt2).to.equal(parseEther("1.15"));

        let currentCandlestick = await dataFeed.getCurrentCandlestick();
        expect(currentCandlestick[0]).to.equal(2);
        expect(currentCandlestick[1]).to.equal(parseEther("1.2"));
        expect(currentCandlestick[2]).to.equal(parseEther("1"));
        expect(currentCandlestick[3]).to.equal(parseEther("1.05"));
        expect(currentCandlestick[4]).to.equal(parseEther("1.15"));
        expect(currentCandlestick[5]).to.equal(parseEther("20"));
        expect(currentCandlestick[6]).to.equal(Number(currentTime) - 7);

        // Previous candlestick.
        let previousCandlestick = await dataFeed.getCandlestickAt(1);
        expect(previousCandlestick[0]).to.equal(1);
        expect(previousCandlestick[1]).to.equal(parseEther("1.1"));
        expect(previousCandlestick[2]).to.equal(parseEther("0.9"));
        expect(previousCandlestick[3]).to.equal(parseEther("1"));
        expect(previousCandlestick[4]).to.equal(parseEther("1.05"));
        expect(previousCandlestick[5]).to.equal(parseEther("10"));
        expect(previousCandlestick[6]).to.equal(Number(currentTime) - 10);
    });
  });
  
  describe("#getDataFeedStatus", () => {
    it("halted", async () => {
        let tx = await dataFeed.haltDataFeed(true);
        await tx.wait();

        let status = await dataFeed.getDataFeedStatus();
        expect(status).to.equal(2);
    });

    it("outdated", async () => {
        let currentTime = await dataFeed.getCurrentTime();

        let tx = await dataFeed.setLastUpdated(Number(currentTime) - 1000);
        await tx.wait();

        let status = await dataFeed.getDataFeedStatus();
        expect(status).to.equal(1);
    });

    it("active", async () => {
        let currentTime = await dataFeed.getCurrentTime();

        let tx = await dataFeed.setLastUpdated(Number(currentTime) - 10);
        await tx.wait();

        let status = await dataFeed.getDataFeedStatus();
        expect(status).to.equal(0);
    });
  });

  describe("#aggregateCandlesticks", () => {
    it("2 candlesticks", async () => {
        let currentTime = await dataFeed.getCurrentTime();
  
        let tx = await dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await dataFeed.setLastUpdated(Number(currentTime) - 70);
        await tx2.wait();

        let tx3 = await dataFeed.connect(otherUser).updateData(parseEther("1.2"), parseEther("1"), parseEther("1.05"), parseEther("1.15"), parseEther("20"), Number(currentTime) - 7);
        await tx3.wait();

        let aggregatedCandlestick = await dataFeed.aggregateCandlesticks(2);
        expect(aggregatedCandlestick[0]).to.equal(parseEther("1.2"));
        expect(aggregatedCandlestick[1]).to.equal(parseEther("0.9"));
        expect(aggregatedCandlestick[2]).to.equal(parseEther("1"));
        expect(aggregatedCandlestick[3]).to.equal(parseEther("1.15"));
        expect(aggregatedCandlestick[4]).to.equal(parseEther("30"));
        expect(aggregatedCandlestick[5]).to.equal(Number(currentTime) - 10);
    });

    it("3 candlesticks, request 5", async () => {
        let currentTime = await dataFeed.getCurrentTime();
  
        let tx = await dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await dataFeed.setLastUpdated(Number(currentTime) - 70);
        await tx2.wait();

        let tx3 = await dataFeed.connect(otherUser).updateData(parseEther("1.2"), parseEther("1"), parseEther("1.05"), parseEther("1.15"), parseEther("20"), Number(currentTime) - 7);
        await tx3.wait();

        let tx4 = await dataFeed.setLastUpdated(Number(currentTime) - 70);
        await tx4.wait();

        let tx5 = await dataFeed.connect(otherUser).updateData(parseEther("1.15"), parseEther("0.7"), parseEther("1.15"), parseEther("0.75"), parseEther("50"), Number(currentTime) - 5);
        await tx5.wait();

        let aggregatedCandlestick = await dataFeed.aggregateCandlesticks(5);
        console.log(aggregatedCandlestick);
        expect(aggregatedCandlestick[0]).to.equal(parseEther("1.2"));
        expect(aggregatedCandlestick[1]).to.equal(parseEther("0.7"));
        expect(aggregatedCandlestick[2]).to.equal(parseEther("1"));
        expect(aggregatedCandlestick[3]).to.equal(parseEther("0.75"));
        expect(aggregatedCandlestick[4]).to.equal(parseEther("80"));
        expect(aggregatedCandlestick[5]).to.equal(Number(currentTime) - 10);
    });

    it("15 candlesticks", async () => {
        let currentTime = await dataFeed.getCurrentTime();
  
        let tx = await dataFeed.connect(otherUser).updateData(parseEther("1.1"), parseEther("0.9"), parseEther("1"), parseEther("1.05"), parseEther("20"), Number(currentTime) - 80);
        await tx.wait();

        let tx2 = await dataFeed.setLastUpdated(Number(currentTime) - 70);
        await tx2.wait();

        let tx3 = await dataFeed.connect(otherUser).updateData(parseEther("1.2"), parseEther("1"), parseEther("1.05"), parseEther("1.15"), parseEther("20"), Number(currentTime) - 70);
        await tx3.wait();

        let tx4 = await dataFeed.setLastUpdated(Number(currentTime) - 70);
        await tx4.wait();

        for (var i = 0; i < 13; i++) {
            let tx5 = await dataFeed.connect(otherUser).updateData(parseEther("1.3"), parseEther("0.7"), parseEther("1.05"), parseEther("1.25"), parseEther("20"), Number(currentTime) - 69 + Number(i));
            await tx5.wait();

            let tx6 = await dataFeed.setLastUpdated(Number(currentTime) - 70);
            await tx6.wait();
        }

        let aggregatedCandlestick = await dataFeed.aggregateCandlesticks(15);
        expect(aggregatedCandlestick[0]).to.equal(parseEther("1.3"));
        expect(aggregatedCandlestick[1]).to.equal(parseEther("0.7"));
        expect(aggregatedCandlestick[2]).to.equal(parseEther("1"));
        expect(aggregatedCandlestick[3]).to.equal(parseEther("1.25"));
        expect(aggregatedCandlestick[4]).to.equal(parseEther("300"));
        expect(aggregatedCandlestick[5]).to.equal(Number(currentTime) - 80);
    });
  });
});*/