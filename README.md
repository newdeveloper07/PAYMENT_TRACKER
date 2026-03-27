# Payment Tracker (Level 2)

Multi-address payment dApp with Solidity smart contract + React frontend.

## Features implemented

- Multi-wallet batch payout (`payMultiple`) in one transaction.
- Real-time event integration from chain (`PaymentSent` listener in frontend).
- Transaction lifecycle visible in UI (`Idle -> Pending -> Success/Error`).
- 3+ handled error types:
  - `EmptyBatch`
  - `LengthMismatch`
  - `InvalidRecipient`
  - `InvalidAmount`
  - `InsufficientEth`
  - Frontend validation and wallet/contract config errors

## Project structure

- `contracts/MultiWalletPaymentTracker.sol` - main contract
- `scripts/deploy.js` - deploy script
- `scripts/sync-contract.js` - exports ABI + deployed address to frontend config
- `frontend/src/App.jsx` - wallet integration, contract call, status updates, live events

## Setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
copy .env.example .env
```

3. Add real values in `.env`:

- `SEPOLIA_RPC_URL`
- `PRIVATE_KEY`
- `ETHERSCAN_API_KEY` (optional)

## Compile + deploy to Sepolia testnet

```bash
npm run compile
npm run deploy:sepolia
```

Copy deployed address from output and set it in `.env` as `CONTRACT_ADDRESS=0x...`.

Then export ABI + address to frontend:

```bash
npm run sync:contract
```

## Run frontend

```bash
npm run dev
```

Open the shown local Vite URL, connect MetaMask on Sepolia, and submit rows in this format:

```text
0xAddress1,0.001
0xAddress2,0.0025
```

## Build frontend

```bash
npm run build
```

## Level 2 evidence checklist

- [x] 3 error types handled
- [ ] Contract deployed on testnet (run deploy command and record address)
- [x] Contract called from frontend
- [x] Transaction status visible
- [ ] Minimum 2+ meaningful commits (commit after contract setup and frontend integration)
- [x] Multi-wallet app with real-time event integration

### Record deployment details here

- Network: Sepolia
- Contract Address: `TBD`
- Deployment Tx Hash: `TBD`
- Frontend Contract Config Synced: `TBD`
