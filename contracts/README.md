# EVoting Smart Contract - Forge Deployment Guide

## Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- MetaMask wallet

## Setup

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
```

## Start Local Anvil Node

```bash
anvil
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 10 pre-funded accounts.

**Important:** Copy the first account's private key from Anvil's output. Add the Anvil network to MetaMask:
- Network Name: Anvil Local
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency Symbol: ETH

Import the first Anvil account into MetaMask using the private key.

## Compile

```bash
forge build
```

## Deploy

```bash
PRIVATE_KEY=<your-anvil-private-key> forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

The deployed contract address will be printed. Copy it and paste it into the frontend app.

## Run Tests

```bash
forge test
```

## Contract Architecture

- **Owner**: The deployer address (admin)
- **Election Config**: Title, start/end times (unix timestamps), active flag
- **Candidates**: Dynamic list managed by owner
- **Voters**: Registered by owner with name, age, wallet, and face descriptor (512 bytes = 128 float32s)
- **Voting**: Voters call `castVote(candidateId)` — one vote per registered wallet
- **Face Data**: Stored fully on-chain as raw bytes (128 float32 values × 4 bytes each = 512 bytes)
