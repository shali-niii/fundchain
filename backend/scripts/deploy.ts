import { network } from "hardhat";

async function main() {
  console.log("Deploying FundChain contract...");

  const { ethers } = await network.connect();
  const FundChain = await ethers.getContractFactory("FundChain");
  const fundChain = await FundChain.deploy();

  await fundChain.waitForDeployment();

  const contractAddress = await fundChain.getAddress();
  console.log(`FundChain deployed successfully to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});