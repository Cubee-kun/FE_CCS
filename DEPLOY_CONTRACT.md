# 🚀 Deploy Smart Contract ke Sepolia

## Method 1: Using Remix IDE (Recommended for Beginners)

### Step 1: Prepare Contract
1. Go to https://remix.ethereum.org
2. Create new file: `DocumentRegistry.sol`
3. Paste contract code (from previous response)
4. Compile with Solidity 0.8.19+

### Step 2: Deploy to Sepolia
1. Click "Deploy & Run Transactions" tab
2. Environment: Select "Injected Provider - MetaMask"
3. MetaMask will pop up - **Make sure you're on Sepolia network**
4. Click "Deploy" button
5. Confirm transaction in MetaMask
6. Wait for confirmation (~15 seconds)
7. **Copy the deployed contract address** (very important!)

### Step 3: Update Frontend
```javascript
// src/services/blockchain.js
const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS"; // ✅ Paste here
```

### Step 4: Verify Contract (Optional but Recommended)
1. Go to https://sepolia.etherscan.io
2. Search your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Select "Solidity (Single file)"
6. Paste your contract code
7. Verify

## Method 2: Using Hardhat (Advanced)

### Install Dependencies
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### Configure Hardhat
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Deploy Script
```javascript
// scripts/deploy.js
async function main() {
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const contract = await DocumentRegistry.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("Contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deploy
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Common Errors & Solutions

### ❌ "insufficient funds for intrinsic transaction cost"
- **Solution**: Get more Sepolia ETH from faucet
- https://sepoliafaucet.com/
- https://faucet.quicknode.com/ethereum/sepolia

### ❌ "UNPREDICTABLE_GAS_LIMIT"
- **Solution**: Contract not deployed or wrong address
- Double-check CONTRACT_ADDRESS in blockchain.js

### ❌ "ENS name not configured"
- **Solution**: Invalid contract address format
- Address must be 42 characters starting with 0x

### ❌ "Transaction underpriced"
- **Solution**: Increase gas price
- MetaMask will suggest automatically

## Verify Deployment

After deployment, test in console:
```javascript
// In browser console (after connecting wallet)
const provider = new ethers.BrowserProvider(window.ethereum);
const contract = new ethers.Contract(
  "YOUR_CONTRACT_ADDRESS",
  ["function getDocumentCount() public view returns (uint256)"],
  provider
);
const count = await contract.getDocumentCount();
console.log("Document count:", count.toString());
```

## Gas Fees Estimate

- **Deploy Contract**: ~0.005 - 0.01 ETH
- **Store Document**: ~0.0001 - 0.0005 ETH per transaction
- Your 0.05 ETH is sufficient for ~50-100 transactions

## Important Notes

1. ⚠️ **Never commit private keys to Git!**
2. ✅ Always test on Sepolia first before mainnet
3. 💰 Keep some ETH for gas fees
4. 🔒 Contract is immutable after deployment
5. 📝 Save contract address and ABI
