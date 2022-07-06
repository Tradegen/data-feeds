const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("Utils", () => {
  let deployer;
  let otherUser;

  let utils;
  let utilsAddress;
  let UtilsFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    UtilsFactory = await ethers.getContractFactory('Utils');
  });

  beforeEach(async () => {
    utils = await UtilsFactory.deploy();
    await utils.deployed();
    utilsAddress = utils.address;
  });
  /*
  describe("#calculateCase", () => {
    it("case 1", async () => {
        let data = await utils.calculateCase(parseEther("5"), parseEther("4"));
        expect(data[0]).to.equal(1);
        expect(data[1]).to.equal(parseEther("1"));
    });

    it("case 2", async () => {
        let data = await utils.calculateCase(parseEther("4"), parseEther("4.5"));
        expect(data[0]).to.equal(2);
        expect(data[1]).to.equal(parseEther("0.5"));
    });

    it("case 3", async () => {
        let data = await utils.calculateCase(parseEther("4"), parseEther("5"));
        expect(data[0]).to.equal(3);
        expect(data[1]).to.equal(parseEther("1"));
    });

    it("case 4", async () => {
        let data = await utils.calculateCase(parseEther("4"), parseEther("6"));
        expect(data[0]).to.equal(4);
        expect(data[1]).to.equal(parseEther("2"));
    });
  });*/

  describe("#calculateScalar", () => {
    it("case 1 -> case 1", async () => {
        let scalar = await utils.calculateScalar(parseEther("1.5"), 0, parseEther("0.9"), true);
        expect(scalar).to.equal(parseEther("1.5625"));
    });

    it("case 1 -> case 2", async () => {
        let scalar = await utils.calculateScalar(parseEther("0.5"), parseEther("0.3"), parseEther("0.5"), true);
        expect(scalar).to.equal("1578947368421052631");
    });

    it("case 1 -> case 3", async () => {
        let scalar = await utils.calculateScalar(parseEther("1.5"), parseEther("1"), parseEther("1.5"), true);
        expect(scalar).to.equal(parseEther("7.5"));
    });

    it("case 1 -> case 4", async () => {
        let scalar = await utils.calculateScalar(parseEther("2.5"), parseEther("2"), parseEther("2.5"), true);
        expect(scalar).to.equal(parseEther("15"));
    });

    it("case 2 -> case 1", async () => {
        let scalar = await utils.calculateScalar(parseEther("0.5"), parseEther("0.7"), parseEther("0.7"), false);
        expect(scalar).to.equal(parseEther("0.56"));
    });

    it("case 2 -> case 2", async () => {
        let scalar = await utils.calculateScalar(0, parseEther("0.6"), parseEther("0.3"), false);
        expect(scalar).to.equal("684210526315789473");
    });

    it("case 2 -> case 3", async () => {
        let scalar = await utils.calculateScalar(parseEther("0.4"), parseEther("1"), parseEther("0.4"), true);
        expect(scalar).to.equal(parseEther("2.6"));
    });

    it("case 2 -> case 4", async () => {
        let scalar = await utils.calculateScalar(parseEther("0.6"), parseEther("1.2"), parseEther("0.6"), true);
        expect(scalar).to.equal(parseEther("3.12"));
    });

    it("case 3 -> case 1", async () => {
        let scalar = await utils.calculateScalar(parseEther("0.5"), parseEther("1.5"), parseEther("1.5"), false);
        expect(scalar).to.equal("133333333333333333");
    });

    it("case 3 -> case 2", async () => {
        let scalar = await utils.calculateScalar(0, parseEther("1"), parseEther("0.8"), false);
        expect(scalar).to.equal("238095238095238095");
    });

    it("case 3 -> case 3", async () => {
        let scalar = await utils.calculateScalar(0, parseEther("1"), 0, true);
        expect(scalar).to.equal(parseEther("1"));
    });

    it("case 3 -> case 4", async () => {
        let scalar = await utils.calculateScalar(parseEther("0.2"), parseEther("1.2"), parseEther("0.2"), true);
        expect(scalar).to.equal(parseEther("1.2"));
    });

    it("case 4 -> case 1", async () => {
        let scalar = await utils.calculateScalar(parseEther("0.1"), parseEther("1.2"), parseEther("1.2"), false);
        expect(scalar).to.equal("165289256198347107");
    });

    it("case 4 -> case 2", async () => {
        let scalar = await utils.calculateScalar(0, parseEther("1.1"), parseEther("0.6"), false);
        expect(scalar).to.equal("303030303030303030");
    });

    it("case 4 -> case 3", async () => {
        let scalar = await utils.calculateScalar(0, parseEther("1.1"), parseEther("0.1"), false);
        expect(scalar).to.equal("909090909090909090");
    });

    it("case 4 -> case 4", async () => {
        let scalar = await utils.calculateScalar(parseEther("0.1"), parseEther("1.2"), parseEther("0.1"), true);
        expect(scalar).to.equal("1090909090909090909");
    });
  });
});