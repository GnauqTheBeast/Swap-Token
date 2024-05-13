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
        const [deployer, user1, user2] = await ethers.getSigners();
        const token = await TOKEN.deploy(name, symbol, toWei(supply));

        const handsomeToken = await TOKEN.deploy("handsome", "HAS", toWei(supply));
        const talentToken = await TOKEN.deploy("talent", "TAL", toWei(supply));
        const passionToken = await TOKEN.deploy("passion", "PAS", toWei(supply));

        // ready to transfer
        await handsomeToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await talentToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await passionToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await handsomeToken.connect(user1).approve(await swapTokenContract.getAddress(), toWei(6 * 1e6));
        await talentToken.connect(user1).approve(await swapTokenContract.getAddress(), toWei(6 * 1e6));
        // give user money 
        await handsomeToken.connect(deployer).transfer(await user1.getAddress(), toWei(6 * 1e6));
        // await talentToken.connect(deployer).transfer(await user1.getAddress(), toWei(6 * 1e6));

        // give contract money
        await handsomeToken.connect(deployer).transfer(await swapTokenContract.getAddress(), toWei(6 * 1e6));
        await talentToken.connect(deployer).transfer(await swapTokenContract.getAddress(), toWei(6 * 1e6));

        return {
            swapTokenContract,
            deployer,
            user1, 
            user2,
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

    describe("Check deposit token", async function () {
        it("check deposit erc20 token", async () => {
            const { swapTokenContract, user1, handsomeToken } = await loadFixture(deployContract);

            const amountDeposit = 3e6;
            const user1Adress = await user1.getAddress();

            await swapTokenContract.connect(user1).deposit(handsomeToken, toWei(amountDeposit));
            expect(await handsomeToken.balanceOf(user1Adress)).to.equal(toWei(amountDeposit));
        })
    })

    describe("Swap Token", async function () {
        // beforeEach(async () => {
        //     const { swapTokenContract, deployer, address1, handsomeToken, talentToken } = await loadFixture(deployContract);
                         
        //     const amountDeposit = 3e6;

        //     await swapTokenContract.connect(deployer).deposit(handsomeToken, toWei(amountDeposit));
        //     await swapTokenContract.connect(deployer).deposit(talentToken, toWei(amountDeposit));

        //     await swapTokenContract.connect(address1).deposit(handsomeToken, toWei(amountDeposit));
        //     await swapTokenContract.connect(address1).deposit(talentToken, toWei(amountDeposit));
        // });

        it("Check swap token to token", async () => {
            const { swapTokenContract, deployer, user1, handsomeToken, talentToken } = await loadFixture(deployContract);
            const HASToTALRate = 2;
            await swapTokenContract.connect(deployer).setRate(handsomeToken, talentToken, HASToTALRate);

            const user1Adress = await user1.getAddress();
            const HAS_Address = await handsomeToken.getAddress();
            const TAL_Address = await talentToken.getAddress();

            // Swap 
            const amountIn = 1e3;
            const amountOut = amountIn * HASToTALRate;
            const balanceBeforeHAS = Number(await handsomeToken.balanceOf(user1Adress));
            const balanceBeforeTAL = Number(await talentToken.balanceOf(user1Adress));
            await swapTokenContract.connect(user1).swap(HAS_Address, TAL_Address, toWei(amountIn));
            const balanceAfterHAS = Number(await handsomeToken.balanceOf(user1Adress));
            const balanceAfterTAL = Number(await talentToken.balanceOf(user1Adress)); 

            console.log("HAS: Before, After", balanceBeforeHAS, balanceAfterHAS);
            console.log("TAL: Before, After", balanceBeforeTAL, balanceAfterTAL);

            expect(balanceBeforeHAS - Number(toWei(amountIn))).to.equal(balanceAfterHAS);
            expect(balanceBeforeTAL + Number(toWei(amountOut))).to.equal(balanceAfterTAL)
        })
    })
})