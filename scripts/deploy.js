import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("⏳ Deploying DocumentRegistry contract...");
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const contract = await DocumentRegistry.deploy();

  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log("\n✅ DocumentRegistry deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("\n🔗 View on Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${address}\n`);

  // Test contract
  console.log("🧪 Testing contract...");
  const count = await contract.getDocumentCount();
  console.log("✅ Initial document count:", count.toString());

  console.log("\n📝 Update blockchain.js with this address:");
  console.log(`   const CONTRACT_ADDRESS = "${address}";\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
