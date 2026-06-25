import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { config as loadEnv } from "dotenv";
import { configVariable, defineConfig } from "hardhat/config";

loadEnv();

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    version: "0.8.29",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test/contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    og: {
      type: "http",
      chainType: "l1",
      url: configVariable("OG_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});
