import { NextResponse } from "next/server"

export const revalidate = false

export function GET() {
  return NextResponse.json({
    service: "honeypot",
    version: "0.2.0",
    description:
      "Multi-chain token honeypot and security checker for AI agents. Detects honeypots, taxes, owner privileges, blacklist functions, and contract vulnerabilities across 8+ EVM chains via GoPlus Security API.",
    payment: {
      method: "Tempo MPP",
      currency: "USDC.e",
      currencyAddress: "0x20C000000000000000000000b9537d11c60E8b50",
      network: "Tempo mainnet",
      chainId: 4217,
      gasAbstracted: true,
      note: "Agents only need USDC.e — no native Tempo gas required. The service sponsors gas via feePayer.",
    },
    chains: [
      "ethereum (1)", "bsc (56)", "polygon (137)", "avalanche (43114)",
      "arbitrum (42161)", "optimism (10)", "base (8453)", "fantom (250)",
    ],
    endpoints: [
      { route: "GET /api/check",       price: "$0.02",       params: "?token=0x...&chain=1",             desc: "basic honeypot check: isHoneypot, buy/sellTax, isOpenSource, isProxy, isMintable, ownerCanChangeBalance, hasBlacklist, antiWhale, transferPausable" },
      { route: "GET /api/check/deep",  price: "$0.04",       params: "?token=0x...&chain=1",             desc: "basic + LP analysis (lockedPercent, dex, pair) + top 10 holders + creator info + cannotSellAll, tradingCooldown, hiddenOwner" },
      { route: "GET /api/check/batch", price: "$0.01/token", params: "?tokens=0x...,0x...&chain=1",      desc: "batch basic check up to 20 tokens, priceCharged = N×$0.01" },
      { route: "GET /api/wallet-risk", price: "$0.02",       params: "?address=0x...&chain=1",           desc: "address security: cybercrime, money_laundering, sanctioned, phishing, blackmail flags + riskScore 0-100" },
      { route: "GET /api/lp",          price: "$0.02",       params: "?token=0x...&chain=1",             desc: "LP details: dex, pair_address, liquidity, lp_holders, lockedPercent" },
      { route: "GET /api/info",        price: "free",        params: "",                                  desc: "this response" },
      { route: "GET /openapi.json",    price: "free",        params: "",                                  desc: "OpenAPI 3.1 spec for agent discovery" },
    ],
    openapi: "/openapi.json",
  })
}
