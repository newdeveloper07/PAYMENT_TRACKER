const hre = require("hardhat");

async function main() {
  const Factory = await hre.ethers.getContractFactory("MultiWalletPaymentTracker");
  const contract = await Factory.deploy();
  await contract.deployed();

  console.log("MultiWalletPaymentTracker deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
