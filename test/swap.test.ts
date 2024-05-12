const { expect } = require("chai");
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const toWei = (value: any) => {
    return ethers.parseUnits(value.toString(), "ether");
  };

describe("SwapToken", async function () {
    const nativeToken = "0x0000000000000000000000000000000000000000";
    const name = "Gnauq";
    const symbol = "GNA";
    const supply = 5 * 10**9;
    async function deployContract() {
        const SwapTokenContract = await ethers.getContractFactory("SwapToken");
        const swapTokenContract = await SwapTokenContract.deploy();

        const TOKEN = await ethers.getContractFactory("Token");
        const [deployer, address1, address2] = await ethers.getSigners();
        const token = await TOKEN.deploy(name, symbol, toWei(supply));

        const handsomeToken = await TOKEN.deploy("handsome", "HAS", toWei(supply));
        const talentToken = await TOKEN.deploy("talent", "TAL", toWei(supply));
        const passionToken = await TOKEN.deploy("passion", "PAS", toWei(supply));

        await handsomeToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await talentToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await passionToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await handsomeToken.connect(address1).approve(await swapTokenContract.getAddress(), toWei(5 * 10**6));
        await talentToken.connect(address1).approve(await swapTokenContract.getAddress(), toWei(5 * 10**6));
        await handsomeToken.connect(deployer).transfer(await address1.getAddress(), toWei(5 * 10**6));
        await talentToken.connect(deployer).transfer(await address1.getAddress(), toWei(5 * 10**6));

        return {
            swapTokenContract,
            deployer,
            address1, 
            address2,
            token,
            handsomeToken,
            talentToken,
            passionToken
        }
    };

    describe("Deployment", function () {
        it("Check Owner", async function () {
            const { swapTokenContract, deployer } = await loadFixture(deployContract);
            const owner = await swapTokenContract.connect(deployer).owner();

            expect(deployer).to.equal(owner);
        })
    });

    describe("Check Rate", function () {
        const rate = 1023;
        const check = async (token1Addr: any, token2Addr: any) => {
            const { swapTokenContract, deployer } = await loadFixture(deployContract);
            await swapTokenContract.connect(deployer).setRate(token1Addr, token2Addr, rate);
            const rate1 = (Number(await swapTokenContract.connect(deployer).getRate(token1Addr, token2Addr)) / 1e18).toFixed(10);
            const rate2 = (Number(await swapTokenContract.connect(deployer).getRate(token2Addr, token1Addr)) / 1e18).toFixed(10);

            expect(rate1).to.equal(rate.toFixed(10));
            expect(rate2).to.equal((1 / rate).toFixed(10))
        }

        it("Check Set Rate Token", async function () {
            const { handsomeToken, talentToken } = await loadFixture(deployContract);
            const handsomeTokenAddress = await handsomeToken.getAddress();
            const talentTokenAddress = await talentToken.getAddress();

            await check(handsomeTokenAddress, talentTokenAddress);
        })
    });

    describe("Swap Token", async function () {
        this.beforeEach(async () => {
            const { swapTokenContract, deployer, address1, handsomeToken, talentToken } = await loadFixture(deployContract);
            const amountIn = 1000;

            await swapTokenContract.connect(deployer).deposit(nativeToken, toWei(amountIn), {
                value: toWei(amountIn),
              });
            await swapTokenContract.connect(deployer).deposit(handsomeToken, toWei(amountIn));
            await swapTokenContract.connect(deployer).deposit(talentToken, toWei(amountIn));

            await swapTokenContract.connect(address1).deposit(handsomeToken, toWei(amountIn));
            await swapTokenContract.connect(address1).deposit(talentToken, toWei(amountIn));
        })
        it("Check swap token", async () => {
            const { swapTokenContract, deployer, address1, handsomeToken, talentToken } = await loadFixture(deployContract);
            const HASHToTALRate = 2;
            await swapTokenContract.connect(deployer).setRate(handsomeToken, talentToken, HASHToTALRate);
            const rate = Number(await swapTokenContract.connect(deployer).getRate(handsomeToken, talentToken));

            const user1Adress = await address1.getAddress();

            const HAS_Address = await handsomeToken.getAddress();
            const TAL_Address = await talentToken.getAddress();

            const amountIn = 10;
            await swapTokenContract.connect(deployer).deposit(nativeToken, toWei(amountIn), {
                value: toWei(amountIn),
              });
            await swapTokenContract.connect(deployer).deposit(handsomeToken, toWei(amountIn));
            await swapTokenContract.connect(deployer).deposit(talentToken, toWei(amountIn));

            await swapTokenContract.connect(address1).deposit(handsomeToken, toWei(amountIn));
            await swapTokenContract.connect(address1).deposit(talentToken, toWei(amountIn));

            // const amountIn = 10;
            const balanceHASBefore = await handsomeToken.balanceOf(user1Adress);

            const balanceTALBefore = await talentToken.balanceOf(user1Adress);
            await swapTokenContract.connect(address1).swap(HAS_Address, TAL_Address, toWei(amountIn));
            const balanceHASAfter = Number(await handsomeToken.balanceOf(user1Adress));
            const balanceTALAfter = Number(await talentToken.balanceOf(user1Adress)); 


            expect(Number(balanceHASBefore - toWei(amountIn))).to.equal(balanceHASAfter)
        })
    })
})