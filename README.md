# OGPass

private ai memory passport on 0G.

connect a wallet, mint an ERC-7857 agent id, encrypt memories in the browser, upload ciphertext to 0G Storage, and use those memories with wallet-signed 0G Compute. you own the passport. OGPass never holds your private key or plaintext memory.

live at [ogpass-fawuzantechs-projects.vercel.app](https://ogpass-fawuzantechs-projects.vercel.app/)

## what it does

use your wallet as the control key for a portable ai companion.

- connect with Family ConnectKit, wagmi, and viem
- mint or read an ERC-7857 Agentic ID on 0G Galileo
- encrypt memory locally before anything leaves the browser
- upload encrypted memory capsules to 0G Storage with the connected wallet signer
- anchor memory hashes and 0G roots on-chain
- discover 0G Compute providers and call 0G Direct with wallet-signed requests
- keep plaintext memory, app-owned storage keys, and app-owned compute secrets out of the dapp

## how it works

OGPass starts with an Agentic ID contract on 0G Chain. the connected wallet mints a passport with an initial memory commitment.

when the owner adds memory, the browser encrypts the plaintext with a local vault key and creates a deterministic hash of the encrypted capsule. the encrypted bytes are uploaded to 0G Storage through the official SDK using the connected wallet signer.

after storage confirms, the owner anchors the memory description, data hash, storage root, and ciphertext hash on the Agentic ID contract. the chain stores commitments and references, not plaintext.

for recall, the user selects a 0G Compute provider, optionally supplies decrypted memory context locally, and sends the prompt through 0G Direct. provider discovery, funding, and inference are wallet-signed. there is no server proxy pretending to be compute.

## contracts

`contracts/OGPassAgentId.sol`

ERC-7857 Agentic ID contract. stores owners, approvals, authorization, delegate access, intelligent data hashes, and encrypted memory anchor events. transfer and clone paths call a verifier contract.

`contracts/TEEDataVerifier.sol`

ERC-7857 verifier adapter for transfer validity proof output. it expects a configured TEE oracle address and rejects invalid proof output.

`contracts/interfaces`

minimal ERC-7857 metadata, verifier, and Agentic ID interfaces used by the contracts and app ABI.

## stack

next.js, react, typescript, tailwind, local shadcn-style components, lucide icons, connectkit, wagmi, viem, ethers, 0G Storage SDK, 0G Compute SDK, crypto-js, hardhat, solidity.

## testnet config

```text
network: 0G galileo
chain id: 16602
rpc: https://evmrpc-testnet.0g.ai
explorer: https://chainscan-galileo.0g.ai
storage indexer: https://indexer-storage-testnet-turbo.0g.ai
agent id contract: 0x833D1bBF1e30894cB20BF228485a43a22FCC3E2D
verifier contract: 0x540dd6496FF29780458Da1bAb487C62F473525BF
```

## local development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

compile contracts:

```bash
npm run contracts:compile
```

deploy contracts:

```bash
OG_RPC_URL=https://evmrpc-testnet.0g.ai \
PRIVATE_KEY=... \
ERC7857_VERIFIER_ADDRESS=... \
npm run contracts:deploy
```

## env

```text
NEXT_PUBLIC_OG_NETWORK=galileo
NEXT_PUBLIC_OG_CHAIN_ID=16602
NEXT_PUBLIC_OG_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_OG_EXPLORER_URL=https://chainscan-galileo.0g.ai
NEXT_PUBLIC_OG_STORAGE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS=0x833D1bBF1e30894cB20BF228485a43a22FCC3E2D
```

## docs

product requirements: [docs/PRD.md](docs/PRD.md)

design dna: [docs/brand-profile.json](docs/brand-profile.json)

## contributing

prs are welcome.

for partnerships or questions, reach out at ibrahimpima76@gmail.com.
