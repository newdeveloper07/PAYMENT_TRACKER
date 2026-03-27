const fs = require("fs");
const path = require("path");

async function main() {
  const artifactsPath = path.join(__dirname, "..", "artifacts", "contracts", "MultiWalletPaymentTracker.sol", "MultiWalletPaymentTracker.json");

  if (!fs.existsSync(artifactsPath)) {
    throw new Error("Contract artifact not found. Run `npm run compile` first.");
  }

  const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
  const abi = artifact.abi;

  const address = process.env.CONTRACT_ADDRESS || "";
  const outputPath = path.join(__dirname, "..", "frontend", "src", "contractConfig.json");

  const payload = {
    contractAddress: address,
    abi
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log("Wrote frontend/src/contractConfig.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
