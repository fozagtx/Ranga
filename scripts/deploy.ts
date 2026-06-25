import { network } from "hardhat";
import { getAddress } from "viem";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  requiredEnv("OG_RPC_URL");
  requiredEnv("PRIVATE_KEY");

  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const existingVerifierAddress = process.env.ERC7857_VERIFIER_ADDRESS;
  let verifierAddress = existingVerifierAddress ? getAddress(existingVerifierAddress) : undefined;
  let verifierDeployed = false;

  if (!verifierAddress) {
    const teeOracleAddress = getAddress(requiredEnv("ERC7857_TEE_ORACLE_ADDRESS"));
    const verifier = await viem.deployContract("TEEDataVerifier", [teeOracleAddress]);
    verifierAddress = verifier.address;
    verifierDeployed = true;
  }

  const contract = await viem.deployContract("OGPassAgentId", [
    "OGPass",
    "OGPASS",
    verifierAddress,
  ]);

  console.log(
    JSON.stringify(
      {
        contract: contract.address,
        deployer: deployer.account.address,
        chainId,
        verifier: verifierAddress,
        verifierDeployed,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
