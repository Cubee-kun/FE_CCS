# 🔗 3TREESIFY Blockchain Integration Setup

## Prerequisites

1. **MetaMask Extension**
   - Install from https://metamask.io/download/
   - Create or import wallet
   - Get Sepolia testnet ETH from faucet

2. **Sepolia Testnet**
   - Network: Sepolia
   - RPC: https://sepolia.infura.io/v3/YOUR_KEY
   - Chain ID: 11155111
   - Block Explorer: https://sepolia.etherscan.io

## Deploy Smart Contract

1. **Using Remix IDE**
   - Go to https://remix.ethereum.org
   - Create new file `DocumentRegistry.sol`
   - Paste contract code
   - Compile with Solidity 0.8.19+
   - Deploy to Sepolia testnet
   - Copy deployed contract address

2. **Update Contract Address**
   ```javascript
   // src/services/blockchain.js
   const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
   ```

## Testing

1. **Get Test ETH**
   - Visit https://sepoliafaucet.com/
   - Enter your MetaMask address
   - Receive test ETH

2. **Connect Wallet**
   - Click "Hubungkan MetaMask" in form
   - Approve connection
   - Submit form
   - Approve transaction

3. **Verify on Etherscan**
   - Click "Lihat di Etherscan"
   - View transaction details
   - Confirm document hash

## Features

✅ **Document Hash Storage**
- Keccak256 hash of form data
- Immutable blockchain proof
- Timestamped records

✅ **3TREESIFY Security**
- Cryptographic proof
- Tamper-proof
- Transparent

## Production Deployment

For mainnet:
1. Deploy contract to Ethereum mainnet
2. Update RPC endpoints
3. Use production-grade Infura/Alchemy key
4. Implement gas optimization
5. Add contract verification on Etherscan
