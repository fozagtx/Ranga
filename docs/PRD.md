# OGPass PRD

## Product

OGPass is a private, wallet-owned agent passport. It solves agent continuity: today, a user's AI assistant forgets them across apps, providers, and models, while platform memory is centralized and non-transferable. A connected owner can mint an ERC-7857 Agentic ID on 0G Chain, seal private memory capsules before they leave the browser, upload ciphertext to 0G Storage with the connected wallet as signer, anchor memory hashes on-chain, and use those memories with 0G Compute Direct through wallet-signed provider requests.

## Product Thesis

The winning 0G-native product is not a storage dashboard. It is **portable private intelligence**:

- **Portable**: the agent identity lives on-chain as an Agentic ID, not inside one app database.
- **Private**: memories are encrypted locally and 0G Storage receives ciphertext, not plaintext.
- **Verifiable**: compute requests go through wallet-signed 0G Direct providers, with provider metadata and verification output surfaced to the user.
- **Ownable**: the wallet controls the passport, memory anchors, usage authorization, and transfer path.

## Non-Negotiables

- No fake live states, seeded agent data, demo balances, simulated transaction hashes, or placeholder explorer links.
- Protected actions must be blocked until a wallet is connected to the configured 0G chain.
- Server APIs must reject missing production credentials instead of falling back to mock providers.
- App-owned storage signer keys, compute credentials, and server session secrets are not required for the dApp path.
- Plaintext memory must not be stored server-side or on-chain.
- Contract transfer and clone must require a real ERC-7857 verifier contract.
- Deployment must require an explicit funded private key and configured network values.
- Public landing must redirect connected wallets to `/vault`.
- Protected routes must redirect disconnected wallets to `/connect`.
- Visual system must follow `docs/brand-profile.json` while avoiding fake live data.

## Users And Roles

| Role | Description | Can | Cannot |
| --- | --- | --- | --- |
| Visitor | No connected wallet | Read public product context, connect wallet | View vault content, call APIs, mint, anchor memory, run inference |
| Connected User | Wallet connected through Family ConnectKit | View app shell, inspect network readiness, prepare encrypted memory, sign storage uploads, sign compute requests, sign contract writes | Write on wrong chain, use app-owned server keys |
| Agent Owner | Connected user that owns an Agentic ID token | Anchor encrypted memories, authorize usage, call companion inference | Transfer or clone without verifier proof |
| Operator | Deployment wallet / contract owner | Deploy contract, configure verifier address, pause/unpause if enabled | Read user plaintext memory |

## Route Map And Permissions

| Route | Purpose | Visitor | Connected User | Agent Owner | Operator | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Public editorial launch surface | Allowed | Redirect to `/vault` | Redirect to `/vault` | Redirect to `/vault` | No protected data; visual reference DNA applied |
| `/connect` | Disconnected wallet site | Allowed | Redirect to `/vault` | Redirect to `/vault` | Redirect to `/vault` | Used when protected app loses wallet connection |
| `/vault` | Protected companion workspace | Redirect to `/connect` | Allowed when correct chain | Full actions for owned token | No special UI | Shows only real wallet, chain, and contract values; missing config is a blocked state, not a fake data row |
| `/vault/identity` | Agentic ID mint/read screen | Wallet gate | Mint/read configured contract | Manage owned identity | No special UI | No fake token ID |
| `/vault/memory` | Encrypt/upload/anchor memory | Wallet gate | Encrypt and upload ciphertext with connected wallet signer | Upload to 0G and anchor if configured | No special UI | Plaintext never crosses browser boundary |
| `/vault/compute` | Companion chat through 0G Compute Direct | Wallet gate | Discover providers, fund provider sub-account, sign inference requests | Uses selected decrypted memory context | No special UI | No app-owned compute proxy fallback |

## Page Requirements

### `/`

- Visible data: product name, public product promise, non-live readiness labels without exposing secrets, visual CSS sky/meadow composition.
- Allowed actions: connect wallet, move to `/connect`, switch to 0G chain through wallet UI.
- Blocked actions: mint, upload, compute.
- Empty state: no wallet connected.
- Error state: missing required public env values.
- Loading state: wallet/client hydration.
- Redirect: connected wallets go to `/vault`.

### `/connect`

- Visible data: connect wallet action, chain target, configuration blockers if public env is missing.
- Allowed actions: connect wallet, switch to 0G chain through wallet UI.
- Blocked actions: mint, upload, compute.
- Empty state: no wallet connected.
- Error state: missing required public env values.
- Loading state: wallet/client hydration.
- Redirect: connected wallets go to `/vault`; disconnected protected-route users land here.

### `/vault`

- Visible data: wallet address, chain, contract address, live readiness checks, owned token lookup.
- Allowed actions: navigate to identity, memory, compute.
- Blocked actions: all writes until correct chain and contract address exist.
- Empty state: no Agentic ID found.
- Error state: chain mismatch, missing contract, required API credential missing.
- Loading state: contract reads and route hydration.

### `/vault/identity`

- Visible data: configured contract, next token ID from chain, current owner token if requested, intelligent data hashes.
- Allowed actions: create a local genesis memory commitment and mint Agentic ID with that derived hash.
- Blocked actions: mint without wallet, wrong chain, missing contract address.
- Empty state: no token selected; lookup and result panels stay collapsed until a real token ID is entered or minted.
- Error state: reverted write or missing verifier for transfer/clone.
- Loading state: contract reads and write confirmation.

### `/vault/memory`

- Visible data: local plaintext editor, encryption key status, wallet-signed upload status, on-chain anchor status.
- Allowed actions: derive/open local vault key, encrypt, upload ciphertext with connected wallet signer, anchor returned root hash.
- Blocked actions: plaintext upload, upload without connected wallet signer, anchor without token.
- Empty state: no session receipt; result rows render only after encryption, upload, or anchor data exists.
- Error state: encryption failure, upload rejection, transaction revert.
- Loading state: encryption, upload, confirmation.

### `/vault/compute`

- Visible data: live 0G Direct provider list, selected provider/model, prompt composer, verification result returned by 0G SDK.
- Allowed actions: discover providers, fund selected provider sub-account, call selected provider with wallet-signed request headers.
- Blocked actions: compute without connected wallet signer, selected provider, provider funds, or prompt.
- Empty state: no session response; response and trace blocks render only after the selected provider returns data.
- Error state: 0G Direct provider or SDK error surfaced as failure.
- Loading state: pending inference.

## UI System

- Component library: shadcn-style local components built with React, Tailwind CSS, `class-variance-authority`, `tailwind-merge`, and Radix primitives where needed.
- Icons: lucide icons for recognizable actions.
- Navigation: reference-inspired floating pill nav on public pages; protected app uses sky-canvas top bar plus rounded pill sidebar/navigation.
- Forms: labeled inputs, textareas, segmented status panels, destructive actions separated.
- Tables/lists: dense record lists for memory anchors and model catalog.
- Toasts/errors: visible inline error panels; no hidden fallback.
- Visual restrictions: sky/cloud/meadow CSS artwork approved from brand profile; no fake protocol status; no decorative purple/orb/bokeh theme.
- Brand system: `docs/brand-profile.json` defines exact visual DNA, copy voice, palette, radii, motion, and no-fake-data constraints.

## Real Integration Requirements

### Public Env

- `NEXT_PUBLIC_OG_NETWORK`
- `NEXT_PUBLIC_OG_CHAIN_ID`
- `NEXT_PUBLIC_OG_RPC_URL`
- `NEXT_PUBLIC_OG_EXPLORER_URL`
- `NEXT_PUBLIC_OG_STORAGE_INDEXER_RPC`
- `NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS`

### Deploy Env

- `OG_RPC_URL`
- `PRIVATE_KEY`
- `ERC7857_VERIFIER_ADDRESS`
- `ERC7857_TEE_ORACLE_ADDRESS`
- `OG_STORAGE_INDEXER_RPC`

## Contract Requirements

- Implement Final ERC-7857 interfaces: `IERC7857DataVerifier`, `IERC7857Metadata`, and `IERC7857`.
- Keep metadata private by storing `IntelligentData` hashes and 0G root references, not plaintext.
- Implement `iTransfer` and `iClone` with required verifier calls and atomic owner/data updates.
- Implement owner authorization, authorization revoke, delegate access, token approvals, and operator approvals.
- Add product-specific memory anchor events for encrypted 0G roots.
- Refuse transfer/clone when verifier is unset or proof output does not match current data hashes.

## No Fake Demo Rules

- No local fixture agents or memory records in UI.
- No generated transaction hashes, storage root hashes, proof IDs, model lists, balances, or explorer URLs.
- Unit tests may use local test accounts only as test harness accounts; UI and deployment scripts must not present them as live state.
- Incomplete production dependencies must render truthful blocked states without placeholder “available/unavailable” copy.

## Acceptance Criteria

- PRD exists before implementation.
- Family ConnectKit wallet connection is configured for 0G custom chain without a required WalletConnect project env.
- Protected routes render a wallet/chain gate before app content.
- Landing redirects connected wallets to `/vault`.
- Protected routes redirect disconnected wallets to `/connect`.
- Memory encryption happens before storage upload.
- 0G Storage upload uses the official SDK with the connected browser wallet signer and returns real SDK errors.
- 0G Compute uses the official Direct SDK with connected wallet signing and does not fallback to app-owned compute proxy calls.
- ERC-7857 contract compiles with Cancun EVM settings.
- Build, lint, typecheck, and contract compile pass.
- Deployment scripts exist and refuse to deploy without required env values.
