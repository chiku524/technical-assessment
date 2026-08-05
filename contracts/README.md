# Blockchain Certificate Contracts

## Setup
```bash
cd contracts
npm install
npx hardhat compile
```

## Local chain
```bash
# Terminal 1 – local node
npx hardhat node

# Terminal 2 – deploy
npx hardhat run scripts/deploy.js --network localhost
```

Copy the printed address into `frontend/.env` as `VITE_CERTIFICATE_CONTRACT_ADDRESS`.

## Networks
Configure `SEPOLIA_RPC_URL` / `POLYGON_AMOY_RPC_URL` and `DEPLOYER_PRIVATE_KEY` in `.env` for testnet deploys.
