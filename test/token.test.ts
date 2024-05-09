const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const fromWei = (value: any) => {
    return Number(ethers.formatEther(value));
  };
  

const toWei = (value: any) => {
    return ethers.parseUnits(value.toString(), "ether");
  };
  
describe("Token", async function () {
  let deployer: any, token: any;
  const name = "Gnauq";
  const symbol = "GNA";
  const supply = 5* 10**9;
  beforeEach(async function () {
    const TOKEN = await ethers.getContractFactory("Token");
    [deployer] = await ethers.getSigners();
    token = await TOKEN.deploy(name, symbol, toWei(supply));
  });

  describe("Deployment", function () {
    it("Track name and symbol of the token", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Mint and check the token", async function () {
      expect(fromWei(await token.totalSupply())).to.equal(supply)
      expect(fromWei(await token.balanceOf(deployer.address))).to.equal(supply)
    });
  })
})