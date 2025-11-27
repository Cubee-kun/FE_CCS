# 🔗 3TREESIFY Frontend Blockchain Integration

## ✅ Pure Frontend Implementation
This setup handles ALL blockchain operations directly in the frontend using ethers.js - no backend blockchain service required.

## Environment Setup

Create/update `.env` file in frontend root:
```bash
# Sepolia Testnet Configuration
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_SEPOLIA_CHAIN_ID=11155111

# Your Wallet Configuration (KEEP PRIVATE!)
VITE_WALLET_PRIVATE_KEY=your_private_key_here

# Smart Contract Address (after deployment)
VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

## Smart Contract Deployment

1. **Using Remix IDE**
   - Go to https://remix.ethereum.org
   - Create new file `DocumentRegistry.sol`
   - Paste your contract code
   - Compile with Solidity 0.8.19+
   - Deploy to Sepolia testnet using MetaMask
   - Copy deployed contract address to `.env`

2. **Contract ABI**
   - Copy ABI from Remix after compilation
   - Update `CONTRACT_ABI` in `blockchain.js` if needed

## Features

✅ **Direct Smart Contract Calls**
- Store documents directly to blockchain
- Verify documents from blockchain
- No backend API dependency

✅ **Real-time Blockchain Data**
- Direct RPC calls to Sepolia
- Transaction proof verification
- Gas tracking and confirmation counts

✅ **Frontend-only Security**
- Private key stored in .env (development only)
- Direct ethers.js integration
- Immutable blockchain proof

## Development Setup

1. **Get Sepolia ETH**
   ```bash
   # Visit faucets:
   https://sepoliafaucet.com/
   https://sepolia-faucet.pk910.de/
   ```

2. **Install Dependencies**
   ```bash
   npm install ethers qrcode jszip
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## Testing

1. **Submit Form** - Data gets stored directly to Sepolia
2. **View Laporan** - See real blockchain verification
3. **Scan QR Code** - Verify with blockchain proof
4. **Check Etherscan** - View transactions on explorer

## Security Notes

⚠️ **Development Only**
- Private keys in .env are for development
- For production, use proper wallet integration
- Never commit private keys to git

✅ **Production Ready**
- MetaMask integration for user wallets
- Environment-based configuration
- Secure key management

## Troubleshooting

**"Blockchain service not ready"**
- Check .env file exists and has correct values
- Verify RPC URL is accessible
- Ensure wallet has ETH for gas

**"Insufficient funds"**
- Get more Sepolia ETH from faucets
- Check wallet balance in BlockchainStatus component

**"Transaction timeout"**
- Sepolia network might be slow
- Increase gas price if needed
- Try again after a few minutes
