const { expect } = require("chai");
const { parseEther } = require("@ethersproject/units");

describe("FeePool", () => {
  let deployer;
  let otherUser;

  let feeToken;
  let feeTokenAddress;
  let FeeTokenFactory;

  let feePool;
  let feePoolAddress;
  let FeePoolFactory;

  before(async () => {
    const signers = await ethers.getSigners();

    deployer = signers[0];
    otherUser = signers[1];

    FeeTokenFactory = await ethers.getContractFactory('TestTokenERC20');
    FeePoolFactory = await ethers.getContractFactory('FeePool');

    feeToken = await FeeTokenFactory.deploy("Fee Token", "FEE");
    await feeToken.deployed();
    feeTokenAddress = feeToken.address;
  });

  beforeEach(async () => {
    feePool = await FeePoolFactory.deploy(deployer.address, feeTokenAddress, otherUser.address);
    await feePool.deployed();
    feePoolAddress = feePool.address;
  });
  
  describe("#setOperator", () => {
    it("onlyOwner", async () => {
      let tx = feePool.connect(otherUser).setOperator(otherUser.address);
      await expect(tx).to.be.reverted;

      let operator = await feePool.operator();
      expect(operator).to.equal(deployer.address);
    });

    it("meets requirements", async () => {
        let tx = await feePool.setOperator(otherUser.address);
        await tx.wait();

        let operator = await feePool.operator();
        expect(operator).to.equal(otherUser.address);
    });
  });

  describe("#setFeeSupplier", () => {
    it("onlyOperator", async () => {
      let tx = feePool.connect(otherUser).setFeeSupplier(deployer.address);
      await expect(tx).to.be.reverted;

      let feeSupplier = await feePool.feeSupplier();
      expect(feeSupplier).to.equal(otherUser.address);
    });

    it("meets requirements", async () => {
        let tx = await feePool.setFeeSupplier(deployer.address);
        await tx.wait();

        let feeSupplier = await feePool.feeSupplier();
        expect(feeSupplier).to.equal(deployer.address);
    });
  });

  describe("#addFees", () => {
    it("onlyFeeSupplier", async () => {
      let tx = await feeToken.approve(feePoolAddress, parseEther("1"));
      await tx.wait();

      let tx2 = feePool.addFees(otherUser.address, parseEther("1"));
      await expect(tx2).to.be.reverted;

      let balance = await feeToken.balanceOf(feePoolAddress);
      expect(balance).to.equal(0);

      let availableFees = await feePool.availableFees(otherUser.address);
      expect(availableFees).to.equal(0);
    });

    it("meets requirements", async () => {
        let tx = await feePool.setFeeSupplier(deployer.address);
        await tx.wait();

        let tx2 = await feeToken.approve(feePoolAddress, parseEther("1"));
        await tx2.wait();

        let tx3 = await feePool.addFees(otherUser.address, parseEther("1"));
        await tx3.wait();

        let balance = await feeToken.balanceOf(feePoolAddress);
        expect(balance).to.equal(parseEther("1"));

        let availableFees = await feePool.availableFees(otherUser.address);
        expect(availableFees).to.equal(parseEther("1"));
    });
  });

  describe("#claimFees", () => {
    it("claim fees", async () => {
        let tx = await feePool.setFeeSupplier(deployer.address);
        await tx.wait();

        let tx2 = await feeToken.approve(feePoolAddress, parseEther("1"));
        await tx2.wait();

        let tx3 = await feePool.addFees(otherUser.address, parseEther("1"));
        await tx3.wait();

        let initialBalanceOther = await feeToken.balanceOf(otherUser.address);

        let tx4 = await feePool.connect(otherUser).claimFees();
        await tx4.wait();

        let newBalanceOther = await feeToken.balanceOf(otherUser.address);
        let expectedNewBalanceOther = BigInt(initialBalanceOther) + BigInt(parseEther("1"));
        expect(newBalanceOther.toString()).to.equal(expectedNewBalanceOther.toString());

        let balanceContract = await feeToken.balanceOf(feePoolAddress);
        expect(balanceContract).to.equal(0);

        let availableFees = await feePool.availableFees(otherUser.address);
        expect(availableFees).to.equal(0);
    });
  });
});