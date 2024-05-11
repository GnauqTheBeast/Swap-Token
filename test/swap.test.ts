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

        const handSomeToken = await TOKEN.deploy("handsome", "HAS", toWei(supply));
        const talentToken = await TOKEN.deploy("talent", "TAL", toWei(supply));
        const passionToken = await TOKEN.deploy("passion", "PAS", toWei(supply));

        await handSomeToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await talentToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await passionToken.connect(deployer).approve(await swapTokenContract.getAddress(), toWei(supply));
        await handSomeToken.connect(address1).approve(await swapTokenContract.getAddress(), toWei(5 * 10**6));
        await talentToken.connect(address1).approve(await swapTokenContract.getAddress(), toWei(5 * 10**6));
        await handSomeToken.connect(deployer).transfer(await address1.address, toWei(5 * 10**6));
        await talentToken.connect(deployer).transfer(await address1.address, toWei(5 * 10**6));

        return {
            swapTokenContract,
            deployer,
            address1, 
            address2,
            token,
            handSomeToken,
            talentToken,
            passionToken
        }
    };

    describe("Deployment", function () {
        const rate = 123123;
        const check = async (token1Addr: any, token2Addr: any) => {
            const { swapTokenContract, deployer } = await loadFixture(deployContract);
            await swapTokenContract.connect(deployer)._setRate(token1Addr, token2Addr, rate);
            const rate1 = await swapTokenContract.connect(deployer)._getRate(token1Addr, token2Addr);
            const rate2 = await swapTokenContract.connect(deployer)._getRate(token2Addr, token1Addr);

            console.log(rate1)
            console.log(rate2)

            expect(rate1).to.equal(rate);
            expect(rate2).to.equal(1e18 / rate);
        }
        it("Check set Rate token", async function () {
            const { handSomeToken, talentToken } = await loadFixture(deployContract);
            const handSomeTokenAddress = await handSomeToken.getAddress();
            const talentTokenAddress = await talentToken.getAddress();

            await check(handSomeTokenAddress, talentTokenAddress);
        })
    })
})