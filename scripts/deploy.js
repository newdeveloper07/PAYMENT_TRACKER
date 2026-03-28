const hre = require("hardhat");

async function main() {
  const network = await hre.ethers.provider.getNetwork();
  const Factory = await hre.ethers.getContractFactory("MultiWalletPaymentTracker");
  const contract = await Factory.deploy();
  await contract.deployed();

  console.log("Network:", `${network.name} (${network.chainId})`);
  console.log("Deployment Tx Hash:", contract.deployTransaction.hash);
  console.log("MultiWalletPaymentTracker deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
