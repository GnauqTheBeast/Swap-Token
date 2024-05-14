const { expect } = require("chai");
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const fromWei = (value: any) => {
    return Number(ethers.formatEther(value));
};
  
const toWei = (value: any) => {
    return ethers.parseUnits(value.toString(), "ether");
};

describe("SwapToken", async function () {
    const nativeToken = "0x0000000000000000000000000000000000000000";
    // const name = "Gnauq";
    // const symbol = "GNA";
    const supply = 5e6;
    async function deployContract() {
        const SwapTokenContract = await ethers.getContractFactory("SwapToken");
        const swapTokenContract = await SwapTokenContract.deploy();

        const TOKEN = await ethers.getContractFactory("Token");
        const [deployer, user1, user2] = await ethers.getSigners();
        // const token = await TOKEN.deploy(name, symbol, toWei(supply));

        const TetherUSD = await TOKEN.deploy("TetherUSD", "USDT", toWei(supply));
        const BNB = await TOKEN.deploy("BNB", "BNB", toWei(supply));
        const USDC = await TOKEN.deploy("USDC", "USDC", toWei(supply));

        // ready to transfer
        await TetherUSD.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await BNB.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await USDC.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await TetherUSD.connect(user1).approve(await swapTokenContract.getAddress(), toWei(6e3));
        await BNB.connect(user1).approve(await swapTokenContract.getAddress(), toWei(6e3));
        // give user money 
        await TetherUSD.connect(deployer).transfer(await user1.getAddress(), toWei(6e3));
        // await BNB.connect(deployer).transfer(await user1.getAddress(), toWei(6 * 1e6));
        
        // give contract money
        await TetherUSD.connect(deployer).transfer(await swapTokenContract.getAddress(), toWei(6e3));
        await BNB.connect(deployer).transfer(await swapTokenContract.getAddress(), toWei(6e3));

        return {
            swapTokenContract,
            deployer,
            user1,
            user2,
            TetherUSD,
            BNB,
            USDC
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
            const { TetherUSD, BNB } = await loadFixture(deployContract);
            const USDTAddress = await TetherUSD.getAddress();
            const BNBAddress = await BNB.getAddress();

            await check(USDTAddress, BNBAddress);
        })
    });

    describe("Check deposit token", async function () {
        it("check deposit erc20 token", async () => {
            const { swapTokenContract, user1, TetherUSD } = await loadFixture(deployContract);

            const amountDeposit = 3e3;
            const user1Address = await user1.getAddress();
            const USDTAddress = await TetherUSD.getAddress();

            await swapTokenContract.connect(user1).deposit(USDTAddress, toWei(amountDeposit));
            expect(await TetherUSD.balanceOf(user1Address)).to.equal(toWei(amountDeposit));
            expect(await swapTokenContract.connect(user1).getSavedToken(USDTAddress)).to.equal(toWei(amountDeposit));
        })
        it("check deposit native token", async () => {
            const { swapTokenContract, user1 } = await loadFixture(deployContract);

            const amountDeposit = 1234;
            const user1Address = await user1.getAddress();

            const balanceUser1InitNativeToken = Number(fromWei(await ethers.provider.getBalance(user1Address)).toFixed(2));
            await swapTokenContract.connect(user1).deposit(nativeToken, toWei(amountDeposit), { value: toWei(amountDeposit) })
            const balanceUser1FinalNativeToken = Number(fromWei(await ethers.provider.getBalance(user1Address)).toFixed(2));

            expect(await swapTokenContract.connect(user1).getSavedToken(nativeToken)).to.equal(toWei(amountDeposit));
            expect(balanceUser1InitNativeToken - balanceUser1FinalNativeToken).to.equal(amountDeposit);
        })
    })

    describe("Check withdraw token", async function () {
        it("check withdraw erc20 token", async () => {
            const { swapTokenContract, user1, TetherUSD } = await loadFixture(deployContract);

            const amountDeposit = 3e3;
            const amountWithdraw = 2e3;
            const USDTAddress = await TetherUSD.getAddress();

            await swapTokenContract.connect(user1).deposit(USDTAddress, toWei(amountDeposit));
            await swapTokenContract.connect(user1).withdraw(USDTAddress, toWei(amountWithdraw));
            expect(amountDeposit - Number(await swapTokenContract.connect(user1).getSavedToken(USDTAddress)) / 1e18).to.equal(amountWithdraw);
        })
        it("check withdraw native token", async () => {
            const { swapTokenContract, user1 } = await loadFixture(deployContract);

            const amountDeposit = 1234;
            const amountWithdraw = 234;
            const user1Address = await user1.getAddress();

            const balanceUser1InitNativeToken = Number(fromWei(await ethers.provider.getBalance(user1Address)).toFixed(2));
            await swapTokenContract.connect(user1).deposit(nativeToken, toWei(amountDeposit), { value: toWei(amountDeposit) });
            await swapTokenContract.connect(user1).withdraw(nativeToken, toWei(amountWithdraw));
            const balanceUser1FinalNativeToken = Number(fromWei(await ethers.provider.getBalance(user1Address)).toFixed(2));
            
            expect(balanceUser1FinalNativeToken - balanceUser1InitNativeToken + amountDeposit).to.equal(amountWithdraw);
        })
    }) 

    describe("Swap Token", async function () {
        it("Check swap token to token", async () => {
            const { swapTokenContract, deployer, user1, TetherUSD, BNB } = await loadFixture(deployContract);
            const rateUSDTtoBNB = 2;
            
            const user1Adress = await user1.getAddress();
            const addressUSDT = await TetherUSD.getAddress();
            const addressBNB = await BNB.getAddress();
            const swapTokenContractAddress = await swapTokenContract.getAddress();
            
            await swapTokenContract.connect(deployer).setRate(addressUSDT, addressBNB, rateUSDTtoBNB);

            // Balance of token in contract
            const initBalanceUSDT = Number(await TetherUSD.balanceOf(swapTokenContractAddress));
            const initBalanceBNB = Number(await BNB.balanceOf(swapTokenContractAddress));
            // Swap 
            const amountIn = 1e3;
            const amountOut = amountIn * rateUSDTtoBNB;
            const balanceBeforeUSDT = Number(await TetherUSD.balanceOf(user1Adress));
            const balanceBeforeBNB = Number(await BNB.balanceOf(user1Adress));
            await swapTokenContract.connect(user1).swap(addressUSDT, addressBNB, toWei(amountIn));
            const balanceAfterUSDT = Number(await TetherUSD.balanceOf(user1Adress));
            const balanceAfterBNB = Number(await BNB.balanceOf(user1Adress));

            // Balance in wallet
            expect(balanceBeforeUSDT - Number(toWei(amountIn))).to.equal(balanceAfterUSDT);
            expect(balanceBeforeBNB + Number(toWei(amountOut))).to.equal(balanceAfterBNB)
            // Balance in contract
            expect((Number(await TetherUSD.balanceOf(swapTokenContractAddress)) - initBalanceUSDT) / 1e18).to.equal(amountIn);
            expect((initBalanceBNB - Number(await BNB.balanceOf(swapTokenContractAddress))) / 1e18).to.equal(amountOut);
        })
        it("check swap native token to erc20 token", async () => {
            const { swapTokenContract, deployer, user1, TetherUSD } = await loadFixture(deployContract);

            const amountIn = 100;
            const nativeTokenToTetherUSDRate = 12;
            const USDT = await TetherUSD.getAddress();
            const user1Address = await user1.getAddress();

            const initBalanceUSDT = Number(await TetherUSD.balanceOf(user1Address)) / 1e18;

            await swapTokenContract.connect(deployer).setRate(nativeToken, USDT, nativeTokenToTetherUSDRate);

            await swapTokenContract.connect(user1).swap(nativeToken, USDT, toWei(amountIn), { value: toWei(amountIn) });
            const finalBalanceUSDT = Number(await TetherUSD.balanceOf(user1Address)) / 1e18;

            expect(initBalanceUSDT + amountIn * nativeTokenToTetherUSDRate).to.equal(finalBalanceUSDT);
        })
        it("check swap erc20 token to native token", async () => {
            const { swapTokenContract, deployer, user1, TetherUSD } = await loadFixture(deployContract);

            // deposit native token to contract
            const amountDeposit = 100;
            await swapTokenContract.connect(deployer).deposit(nativeToken, toWei(amountDeposit), { value: toWei(amountDeposit) });

            const amountIn = 10;
            const nativeTokenToTetherUSDRate = 2;
            const USDT = await TetherUSD.getAddress();
            const user1Address = await user1.getAddress();
            
            await swapTokenContract.connect(deployer).setRate(nativeToken, USDT, nativeTokenToTetherUSDRate);
            const rateUSDTtoNativeToken = Number(await swapTokenContract.connect(deployer).getRate(USDT, nativeToken)) / 1e18;
            
            const initBalanceNativeToken = Number(fromWei(await ethers.provider.getBalance(user1Address)));
            await swapTokenContract.connect(user1).swap(USDT, nativeToken, toWei(amountIn));
            const finalBalanceNativeToken = Number(fromWei(await ethers.provider.getBalance(user1Address))).toFixed(2);

            expect((initBalanceNativeToken + amountIn * rateUSDTtoNativeToken).toFixed(2)).to.equal(finalBalanceNativeToken);
        })
    })
})