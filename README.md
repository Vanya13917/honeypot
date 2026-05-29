# honeypot

Multi-chain token honeypot & security checker for AI agents on Tempo MPP.

Detect honeypots, taxes, owner privileges, blacklist functions, contract vulnerabilities, and wallet risk scores via GoPlus Security across 8 EVM chains.

## Live

- Service: https://honeypot.ivan-tempo.xyz
- OpenAPI: https://honeypot.ivan-tempo.xyz/openapi.json

## Endpoints

| Route | Price | Description |
|---|---|---|
| GET /api/check | $0.02 | Basic honeypot check — isHoneypot, buy/sell tax, open source, proxy, mintable, blacklist, anti-whale |
| GET /api/check/deep | $0.04 | Full analysis + LP details + top 10 holders + creator info |
| GET /api/check/batch | $0.01/token | Up to 20 tokens in one request |
| GET /api/wallet-risk | $0.02 | Address security score — cybercrime, sanctions, phishing, darkweb |
| GET /api/lp | $0.02 | Liquidity pool details — DEX, pairs, locked percent, LP holders |
| GET /api/info | free | Service metadata |
| GET /openapi.json | free | Agent discovery |

## Supported Chains

Ethereum, BSC, Polygon, Avalanche, Arbitrum, Optimism, Base, Fantom

## Payment

Tempo MPP (x402). USDC.e on Tempo mainnet (chainId 4217). Gas-abstracted via feePayer — agents only need USDC.e, no native gas required.

Recipient: `0x0d509f743bc6fc907d5f63d8b0dae1fca8d80897`

## Usage

```sh
tempo request -t -X GET 'https://honeypot.ivan-tempo.xyz/api/check?token=0xdAC17F958D2ee523a2206206994597C13D831ec7&chain=1'
```

Query parameters: `token` (0x address), `chain` (chain id or name, default `1`).

## Known Limitations

Passkey wallets are currently blocked by a Tempo keychain precompile bug: the precompile returns `KeyAlreadyExists` when a transaction re-submits a `keyAuthorization` for an already-registered key. Since `keyAuthorization` is part of the signed payload it cannot be stripped server-side.

EOA wallets work fully. Tracking: [tempoxyz/mpp#657](https://github.com/tempoxyz/mpp/issues/657).

## Stack

Next.js · mppx · Vercel · GoPlus Security API

## Tech Notes

- 5-minute in-process LRU cache per `(token, chain)` to conserve GoPlus API quota.
- `feePayer: true` — the service sponsors gas so agents only need USDC.e on Tempo mainnet.
