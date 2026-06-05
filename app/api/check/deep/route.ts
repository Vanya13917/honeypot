import { NextResponse } from "next/server"
import { mppx, PRICES } from "@/lib/mpp"
import { goPlusCache } from "@/lib/cache"
import { fetchTokenSecurity, CHAIN_IDS, CHAIN_NAMES } from "@/lib/goplus"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type HolderRaw = Record<string, unknown>

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")?.toLowerCase()
  const chainParam = url.searchParams.get("chain") || "1"

  const result = await mppx.charge({ amount: "0.04" })(request)
  if (result.status === 402) return result.challenge

  if (!token || !/^0x[a-fA-F0-9]{40}$/.test(token)) {
    return result.withReceipt(NextResponse.json({ error: "invalid_token" }, { status: 400 }))
  }

  const chainId = CHAIN_IDS[chainParam.toLowerCase()] || chainParam
  if (!CHAIN_NAMES[chainId]) {
    return result.withReceipt(NextResponse.json({ error: "unsupported_chain" }, { status: 400 }))
  }

  const cacheKey = `deep:${token}:${chainId}`
  const cached = goPlusCache.get(cacheKey)
  if (cached) return result.withReceipt(NextResponse.json({ ...cached, cached: true }))

  try {
    const data = await fetchTokenSecurity(token, chainId)

    const lpHolders = Array.isArray(data.lp_holders) ? (data.lp_holders as HolderRaw[]) : []
    const lockedLpPercent = lpHolders.reduce(
      (sum, h) => h.is_locked === 1 ? sum + Number(h.percent || 0) : sum, 0
    )
    const dexList = Array.isArray(data.dex) ? data.dex : []
    const holders = Array.isArray(data.holders) ? (data.holders as HolderRaw[]).slice(0, 10) : []

    const payload = {
      token,
      chain: CHAIN_NAMES[chainId],
      chainId: Number(chainId),
      isHoneypot: data.is_honeypot === "1",
      buyTax: data.buy_tax != null ? Number(data.buy_tax) : null,
      sellTax: data.sell_tax != null ? Number(data.sell_tax) : null,
      isOpenSource: data.is_open_source === "1",
      isProxy: data.is_proxy === "1",
      isMintable: data.is_mintable === "1",
      ownerCanChangeBalance: data.owner_change_balance === "1",
      hasBlacklist: data.is_blacklisted === "1",
      antiWhale: data.is_anti_whale === "1",
      transferPausable: data.transfer_pausable === "1",
      cannotSellAll: data.cannot_sell_all === "1",
      tradingCooldown: data.trading_cooldown === "1",
      hiddenOwner: data.hidden_owner === "1",
      tokenName: data.token_name,
      tokenSymbol: data.token_symbol,
      holderCount: data.holder_count != null ? Number(data.holder_count) : null,
      totalSupply: data.total_supply,
      creatorAddress: data.creator_address,
      creatorPercent: data.creator_percent != null ? Number(data.creator_percent) : null,
      ownerAddress: data.owner_address,
      ownerPercent: data.owner_percent != null ? Number(data.owner_percent) : null,
      lp: {
        dex: dexList,
        lockedPercent: (lockedLpPercent * 100).toFixed(2),
        holders: lpHolders,
      },
      topHolders: holders.map((h) => ({
        address: h.address,
        percent: Number(h.percent || 0),
        isContract: h.is_contract === 1,
        isLocked: h.is_locked === 1,
        tag: h.tag,
      })),
    }
    goPlusCache.set(cacheKey, payload)
    return result.withReceipt(NextResponse.json(payload))
  } catch (err) {
    console.error("goplus_error", err)
    return result.withReceipt(
      NextResponse.json({ error: "fetch_failed", message: (err as Error).message }, { status: 500 })
    )
  }
}
