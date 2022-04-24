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
    DataFeedFactory = await ethers.getContractFactory('CandlestickDataFeed');

    testToken = await TestTokenFactory.deploy("Test Token", "TEST");
    await testToken.deployed();
    testTokenAddress = testToken.address;
  });

  beforeEach(async () => {
    dataFeed = await DataFeedFactory.deploy(otherUser.address, deployer.address, testTokenAddress, "TEST");
    await dataFeed.deployed();
    dataFeedAddress = dataFeed.address;
  });
  
  describe("#setOperator", () => {
    it("onlyOwner", async () => {
      let tx = dataFeed.connect(otherUser).setOperator(otherUser.address);
      await expect(tx.wait()).to.be.reverted;

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
      await expect(tx.wait()).to.be.reverted;

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
      await expect(tx.wait()).to.be.reverted;

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
});*/