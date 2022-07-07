const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("VTEDataFeed", () => {
  let deployer;
  let otherUser;

  let mockDataFeed;
  let candlestickDataFeed_BTC;
  let candlestickDataFeedAddress_BTC;
  let candlestickDataFeed_ETH;
  let candlestickDataFeedAddress_ETH;
  let CandlestickDataFeedFactory;

  let VTE;
  let VTEAddress;
  let VTEFactory;

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

  let currentTime = 0;

  before(async () => {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    otherUser = signers[1];

    UtilsFactory = await ethers.getContractFactory('Utils');
    utils = await UtilsFactory.deploy();
    await utils.deployed();
    utilsAddress = utils.address;

    CandlestickDataFeedFactory = await ethers.getContractFactory('TestCandlestickDataFeed');
    VTEFactory = await ethers.getContractFactory('TestVirtualTradingEnvironment');
    TokenFactory = await ethers.getContractFactory('TestTokenERC20');
    FeePoolFactory = await ethers.getContractFactory('FeePool');
    DataSourceFactory = await ethers.getContractFactory('TradegenCandlestickDataSource');
    CandlestickDataFeedRegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    OracleFactory = await ethers.getContractFactory('Oracle');
    RegistryFactory = await ethers.getContractFactory('CandlestickDataFeedRegistry');
    VTEDataFeedFactory = await ethers.getContractFactory('TestVTEDataFeed', {
        libraries: {
            Utils: utilsAddress,
        },
      });

    feeToken = await TokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;

    feePool = await FeePoolFactory.deploy(deployer.address, feeTokenAddress);
    await feePool.deployed();
    feePoolAddress = feePool.address;
  });

  beforeEach(async () => {
    VTE = await VTEFactory.deploy(deployer.address);
    await VTE.deployed();
    VTEAddress = VTE.address;

    candlestickDataFeedRegistry = await CandlestickDataFeedRegistryFactory.deploy();
    await candlestickDataFeedRegistry.deployed();
    candlestickDataFeedRegistryAddress = candlestickDataFeedRegistry.address;

    dataSource = await DataSourceFactory.deploy(candlestickDataFeedRegistryAddress);
    await dataSource.deployed();
    dataSourceAddress = dataSource.address;

    oracle = await OracleFactory.deploy(dataSourceAddress);
    await oracle.deployed();
    oracleAddress = oracle.address;

    VTEDataFeed = await VTEDataFeedFactory.deploy(deployer.address, deployer.address, feePoolAddress, oracleAddress, VTEAddress, feeTokenAddress, parseEther("1"));
    await VTEDataFeed.deployed();
    VTEDataFeedAddress = VTEDataFeed.address;

    mockDataFeed = await CandlestickDataFeedFactory.deploy(1, otherUser.address, deployer.address, "TEST");
    await mockDataFeed.deployed();
    currentTime = await mockDataFeed.getCurrentTime();
    
    let tx = await candlestickDataFeedRegistry.registerDataFeed("BTC", 1, deployer.address);
    await tx.wait();
    
    candlestickDataFeedAddress_BTC = await candlestickDataFeedRegistry.getDataFeedAddress("BTC", 1);
    candlestickDataFeed_BTC = CandlestickDataFeedFactory.attach(candlestickDataFeedAddress_BTC);

    let tx2 = await candlestickDataFeedRegistry.registerDataFeed("ETH", 1, deployer.address);
    await tx2.wait();
    
    candlestickDataFeedAddress_ETH = await candlestickDataFeedRegistry.getDataFeedAddress("ETH", 1);
    candlestickDataFeed_ETH = CandlestickDataFeedFactory.attach(candlestickDataFeedAddress_ETH);
  });
  /*
  describe("#updateDedicatedDataProvider", () => {
    it("onlyOperator", async () => {
        let tx = VTEDataFeed.connect(otherUser).updateDedicatedDataProvider(otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
      let tx = await VTEDataFeed.updateDedicatedDataProvider(otherUser.address);
      await tx.wait();

      let provider = await VTEDataFeed.dataProvider();
      expect(provider).to.equal(otherUser.address);
    });
  });

  describe("#setOperator", () => {
    it("onlyOperator", async () => {
        let tx = VTEDataFeed.connect(otherUser).setOperator(otherUser.address);
        await expect(tx).to.be.reverted;
    });

    it("meets requirements", async () => {
        let tx = await VTEDataFeed.setOperator(otherUser.address);
        await tx.wait();

        let operator = await VTEDataFeed.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });

  describe("#updateUsageFee", () => {
    it("onlyVTEOwner", async () => {
        let tx = VTEDataFeed.connect(otherUser).updateUsageFee(parseEther("88"));
        await expect(tx).to.be.reverted;

        let fee = await VTEDataFeed.usageFee();
        expect(fee).to.equal(parseEther("1"));
    });

    it("fee too high", async () => {
        let tx = VTEDataFeed.updateUsageFee(parseEther("888888"));
        await expect(tx).to.be.reverted;

        let fee = await VTEDataFeed.usageFee();
        expect(fee).to.equal(parseEther("1"));
    });

    it("meets requirements", async () => {
        let tx = await VTEDataFeed.updateUsageFee(parseEther("88"));
        await tx.wait();

        let fee = await VTEDataFeed.usageFee();
        expect(fee).to.equal(parseEther("88"));
    });

    it("not enough time between updates", async () => {
        let tx = await VTEDataFeed.updateUsageFee(parseEther("88"));
        await tx.wait();

        let tx2 = VTEDataFeed.updateUsageFee(parseEther("42"));
        await expect(tx2).to.be.reverted;

        let fee = await VTEDataFeed.usageFee();
        expect(fee).to.equal(parseEther("88"));
    });
  });

  describe("#calculateTokenPrice", () => {
    it("no trades yet", async () => {
        let price = await VTEDataFeed.calculateTokenPrice(parseEther("1"), parseEther("0.5"));
        expect(price).to.equal(parseEther("1"));
    });

    it("case 1", async () => {
        let tx = await VTEDataFeed.setNumberOfUpdates(1);
        await tx.wait();

        let price = await VTEDataFeed.calculateTokenPrice(parseEther("1"), parseEther("0.5"));
        expect(price).to.equal(parseEther("1.5"));
    });

    it("case 2", async () => {
        let tx = await VTEDataFeed.setNumberOfUpdates(1);
        await tx.wait();

        let price = await VTEDataFeed.calculateTokenPrice(parseEther("0.5"), parseEther("1"));
        expect(price).to.equal(parseEther("0.6"));
    });

    it("case 3", async () => {
        let tx = await VTEDataFeed.setNumberOfUpdates(1);
        await tx.wait();

        let price = await VTEDataFeed.calculateTokenPrice(parseEther("0.5"), parseEther("1.5"));
        expect(price).to.equal(parseEther("0.2"));
    });

    it("case 4", async () => {
        let tx = await VTEDataFeed.setNumberOfUpdates(1);
        await tx.wait();

        let price = await VTEDataFeed.calculateTokenPrice(parseEther("0.5"), parseEther("1.75"));
        expect(price).to.equal(parseEther("0.16"));
    });
  });
  
  describe("#calculateCurrentValues", () => {
    it("one profitable long position", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(1);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, true, parseEther("1"), parseEther("1"), "BTC");
        await tx2.wait();
        
        let tx3 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.2"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let data = await VTEDataFeed.calculateCurrentValues("BTC");
        expect(data[0]).to.equal(parseEther("0.2"));
        expect(data[1]).to.equal(0);
        expect(data[2]).to.equal(parseEther("0.2"));
        expect(data[3]).to.be.true;
    });

    it("one profitable short position", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(1);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, false, parseEther("1"), parseEther("1"), "BTC");
        await tx2.wait();
        
        let tx3 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.8"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let data = await VTEDataFeed.calculateCurrentValues("BTC");
        expect(data[0]).to.equal(parseEther("0.2"));
        expect(data[1]).to.equal(0);
        expect(data[2]).to.equal(parseEther("0.2"));
        expect(data[3]).to.be.true;
    });

    it("one unprofitable long position", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(1);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, true, parseEther("1"), parseEther("1"), "BTC");
        await tx2.wait();
        
        let tx3 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.8"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let data = await VTEDataFeed.calculateCurrentValues("BTC");
        expect(data[0]).to.equal(0);
        expect(data[1]).to.equal(parseEther("0.2"));
        expect(data[2]).to.equal(parseEther("0.2"));
        expect(data[3]).to.be.false;
    });

    it("one unprofitable short position", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(1);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, false, parseEther("1"), parseEther("1"), "BTC");
        await tx2.wait();
        
        let tx3 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.2"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let data = await VTEDataFeed.calculateCurrentValues("BTC");
        expect(data[0]).to.equal(0);
        expect(data[1]).to.equal(parseEther("0.2"));
        expect(data[2]).to.equal(parseEther("0.2"));
        expect(data[3]).to.be.false;
    });

    it("multiple positions", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(2);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, true, parseEther("1"), parseEther("3"), "BTC");
        await tx2.wait();

        let tx3 = await VTEDataFeed.setPosition(2, false, parseEther("10"), parseEther("5"), "ETH");
        await tx3.wait();
        
        let tx4 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.8"), parseEther("10"), Number(currentTime) - 10);
        await tx4.wait();

        let tx5 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("9"), parseEther("10"), Number(currentTime) - 10);
        await tx5.wait();

        let data = await VTEDataFeed.calculateCurrentValues("BTC");
        expect(data[0]).to.equal(parseEther("0.5"));
        expect(data[1]).to.equal(parseEther("0.6"));
        expect(data[2]).to.equal(parseEther("0.6"));
        expect(data[3]).to.be.false;
    });
  });

  describe("#getTokenPrice", () => {
    it("case 1", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(1);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, true, parseEther("1"), parseEther("1"), "BTC");
        await tx2.wait();
        
        let tx3 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.2"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("1.2"));
    });

    it("case 2", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(1);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, true, parseEther("1"), parseEther("1"), "BTC");
        await tx2.wait();
        
        let tx3 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.5"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.6"));
    });

    it("case 3", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(1);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, true, parseEther("1"), parseEther("2"), "BTC");
        await tx2.wait();
        
        let tx3 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.5"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.2"));
    });

    it("case 4", async () => {
        let tx = await VTEDataFeed.setNumberOfPositions(1);
        await tx.wait();

        let tx2 = await VTEDataFeed.setPosition(1, true, parseEther("1"), parseEther("5"), "BTC");
        await tx2.wait();
        
        let tx3 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.75"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.16"));
    });
  });

  describe("#updateData", () => {
    it("onlyDataProvider", async () => {
        let tx = VTEDataFeed.connect(otherUser).updateData("BTC", true, parseEther("1"), parseEther("1"));
        await expect(tx).to.be.reverted;

        let numberOfUpdates = await VTEDataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(0);
    });

    it("no existing positions", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.2"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx2.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let numberOfUpdates = await VTEDataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(1);

        let positionIndex = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex).to.equal(1);

        let position = await VTEDataFeed.positions(1);
        expect(position[0]).to.be.true;
        expect(position[1]).to.equal(parseEther("1"));
        expect(position[2]).to.equal(parseEther("1"));
        expect(position[3]).to.equal("BTC");
    });

    it("existing position in different asset", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.2"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx2.wait();

        let tx3 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("10"), parseEther("10"), Number(currentTime) - 10);
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", false, parseEther("5"), parseEther("1"));
        await tx4.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(2);

        let numberOfUpdates = await VTEDataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(2);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(2);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.true;
        expect(position1[1]).to.equal(parseEther("1"));
        expect(position1[2]).to.equal(parseEther("1"));
        expect(position1[3]).to.equal("BTC");

        let position2 = await VTEDataFeed.positions(2);
        expect(position2[0]).to.be.false;
        expect(position2[1]).to.equal(parseEther("5"));
        expect(position2[2]).to.equal(parseEther("1"));
        expect(position2[3]).to.equal("ETH");
    });

    it("add to position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("2"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("2"), parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let numberOfUpdates = await VTEDataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(2);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.true;
        expect(position1[1]).to.equal("1333333333333333333");
        expect(position1[2]).to.equal(parseEther("2"));
        expect(position1[3]).to.equal("BTC");
    });

    it("close position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("2"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", false, parseEther("2"), parseEther("1"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(0);

        let numberOfUpdates = await VTEDataFeed.numberOfUpdates();
        expect(numberOfUpdates).to.equal(2);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.false;
        expect(position1[1]).to.equal(0);
        expect(position1[2]).to.equal(0);
        expect(position1[3]).to.equal("");
    });
  });*/

  describe("#updatePositions", () => {/*
    it("no existing positions; long", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx2.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex).to.equal(1);

        let position = await VTEDataFeed.positions(1);
        expect(position[0]).to.be.true;
        expect(position[1]).to.equal(parseEther("1"));
        expect(position[2]).to.equal(parseEther("1"));
        expect(position[3]).to.equal("BTC");

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("1"));
    });

    it("no existing positions; short", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", false, parseEther("1"), parseEther("1"));
        await tx2.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex).to.equal(1);

        let position = await VTEDataFeed.positions(1);
        expect(position[0]).to.be.false;
        expect(position[1]).to.equal(parseEther("1"));
        expect(position[2]).to.equal(parseEther("1"));
        expect(position[3]).to.equal("BTC");

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("1"));
    });

    it("add to profitable long position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("2"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("2"), parseEther("1"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.true;
        expect(position1[1]).to.equal("1333333333333333333");
        expect(position1[2]).to.equal(parseEther("2"));
        expect(position1[3]).to.equal("BTC");

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("2"));
    });

    it("add to profitable short position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", false, parseEther("2"), parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", false, parseEther("1"), parseEther("1"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.false;
        expect(position1[1]).to.equal("1333333333333333333");
        expect(position1[2]).to.equal(parseEther("2"));
        expect(position1[3]).to.equal("BTC");

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal("1499999999999999999");
    });

    it("add to unprofitable long position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("2"), parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.true;
        expect(position1[1]).to.equal("1333333333333333333");
        expect(position1[2]).to.equal(parseEther("2"));
        expect(position1[3]).to.equal("BTC");

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal("600000000000000001");
    });

    it("add to unprofitable short position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.8"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", false, parseEther("1.2"), parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", false, parseEther("1.8"), parseEther("1"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.false;
        expect(position1[1]).to.equal(parseEther("1.44"));
        expect(position1[2]).to.equal(parseEther("2"));
        expect(position1[3]).to.equal("BTC");

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.6"));
    });

    it("flip long position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("2"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", false, parseEther("2"), parseEther("2"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.false;
        expect(position1[1]).to.equal(parseEther("2"));
        expect(position1[2]).to.equal(parseEther("1"));
        expect(position1[3]).to.equal("BTC");

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("2"));
    });

    it("flip short position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", false, parseEther("2"), parseEther("1"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("2"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let position1 = await VTEDataFeed.positions(1);
        expect(position1[0]).to.be.true;
        expect(position1[1]).to.equal(parseEther("1"));
        expect(position1[2]).to.equal(parseEther("1"));
        expect(position1[3]).to.equal("BTC");

        let tx4 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx5.wait();

        let tx6 = await VTEDataFeed.getTokenPrice();
        let temp = await tx6.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("1.5"));
    });*/

    it("reduce position; case 1 -> case 1; same position", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.75"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("2"));
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", false, parseEther("1.75"), parseEther("1"));
        await tx3.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("2.5"));
    });

    it("reduce position; case 1 -> case 1; different positions", async () => {
        let tx = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.9"), parseEther("10"), Number(currentTime) - 10);
        await tx.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.6"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("1.9"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("2.5"));
    });

    it("reduce position; case 1 -> case 2", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.5"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.7"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("1.5"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal("1799999999999999999");
    });

    it("reduce position; case 1 -> case 3", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("2.5"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.5"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", false, parseEther("1"), parseEther("2"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("2.5"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("2.25"));
    });

    it("reduce position; case 1 -> case 4", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("3.5"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("2"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", false, parseEther("1"), parseEther("2"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("3.5"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("2.25"));
    });

    it("reduce position; case 2 -> case 1", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.5"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.3"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("ETH", false, parseEther("0.3"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(0);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("1.26"));
    });

    it("reduce position; case 2 -> case 2", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.7"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.7"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("ETH", false, parseEther("0.7"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(0);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal("779999999999999999");
    });

    it("reduce position; case 2 -> case 3", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.4"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.5"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("2"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("1.4"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.78"));
    });

    it("reduce position; case 2 -> case 4", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.6"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.4"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("2"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("1.6"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.78"));
    });

    it("reduce position; case 3 -> case 1", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.5"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.5"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("3"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("0.5"), parseEther("3"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.3"));
    });

    it("reduce position; case 3 -> case 2", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.2"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.8"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("0.2"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.3"));
    });

    it("reduce position; case 3 -> case 4", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.2"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.4"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("2"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("1.2"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal(parseEther("0.3"));
    });

    it("reduce position; case 4 -> case 1", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.4"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.1"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("2"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("0.4"), parseEther("2"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal("272727272727272728");
    });

    it("reduce position; case 4 -> case 2", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.4"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.5"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("0.4"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal("272727272727272728");
    });

    it("reduce position; case 4 -> case 3", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.9"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.5"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("1"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("2"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("BTC", false, parseEther("0.9"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(0);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(1);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal("272727272727272728");
    });

    it("reduce position; case 4 -> case 4", async () => {
        let tx = await VTEDataFeed.setLatestPortfolioValue(parseEther("1.5"));
        await tx.wait();

        let tx1 = await candlestickDataFeed_BTC.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("0.4"), parseEther("10"), Number(currentTime) - 10);
        await tx1.wait();

        let tx2 = await candlestickDataFeed_ETH.updateData(parseEther("1"), parseEther("1"), parseEther("1"), parseEther("1.1"), parseEther("10"), Number(currentTime) - 10);
        await tx2.wait();

        let tx3 = await VTEDataFeed.updateData("BTC", true, parseEther("1"), parseEther("2"));
        await tx3.wait();

        let tx4 = await VTEDataFeed.updateData("ETH", true, parseEther("1"), parseEther("1"));
        await tx4.wait();

        let tx5 = await VTEDataFeed.updateData("ETH", false, parseEther("1.1"), parseEther("1"));
        await tx5.wait();
        
        let numberOfPositions = await VTEDataFeed.numberOfPositions();
        expect(numberOfPositions).to.equal(1);

        let positionIndex1 = await VTEDataFeed.positionIndexes("BTC");
        expect(positionIndex1).to.equal(1);

        let positionIndex2 = await VTEDataFeed.positionIndexes("ETH");
        expect(positionIndex2).to.equal(0);

        let tx6 = await feeToken.approve(VTEDataFeedAddress, parseEther("1"));
        await tx6.wait();

        let tx7 = await VTEDataFeed.setNumberOfUpdates(1);
        await tx7.wait();

        let tx8 = await VTEDataFeed.getTokenPrice();
        let temp = await tx8.wait();
        let event = temp.events[temp.events.length - 1];
        let price = event.args.tokenPrice;
        expect(price).to.equal("272727272727272728");
    });
  });
});