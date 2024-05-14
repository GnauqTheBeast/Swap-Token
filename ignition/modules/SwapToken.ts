import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenModule = buildModule("TokenModule", (m) => {
  const token = m.contract("SwapToken");

  return { token };
});

module.exports = TokenModule;