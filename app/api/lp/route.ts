import { NextResponse } from "next/server"
import { mppx, PRICES } from "@/lib/mpp"
import { goPlusCache } from "@/lib/cache"
import { fetchTokenSecurity, CHAIN_IDS, CHAIN_NAMES } from "@/lib/goplus"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LpHolderRaw = Record<string, unknown>

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")?.toLowerCase()
  const chainParam = url.searchParams.get("chain") || "1"

  const result = await mppx.charge({ amount: "0.02" })(request)
  if (result.status === 402) return result.challenge

  if (!token || !/^0x[a-fA-F0-9]{40}$/.test(token)) {
    return result.withReceipt(NextResponse.json({ error: "invalid_token" }, { status: 400 }))
  }

  const chainId = CHAIN_IDS[chainParam.toLowerCase()] || chainParam
  if (!CHAIN_NAMES[chainId]) {
    return result.withReceipt(NextResponse.json({ error: "unsupported_chain" }, { status: 400 }))
  }

  const cacheKey = `lp:${token}:${chainId}`
  const cached = goPlusCache.get(cacheKey)
  if (cached) return result.withReceipt(NextResponse.json({ ...cached, cached: true }))

  try {
    const data = await fetchTokenSecurity(token, chainId)

    const dexList = Array.isArray(data.dex) ? (data.dex as LpHolderRaw[]) : []
    const lpHolders = Array.isArray(data.lp_holders) ? (data.lp_holders as LpHolderRaw[]) : []
    const lockedPercent = lpHolders.reduce(
      (sum, h) => h.is_locked === 1 ? sum + Number(h.percent || 0) : sum, 0
    )
    const lockedCount = lpHolders.filter((h) => h.is_locked === 1).length

    const payload = {
      token,
      chain: CHAIN_NAMES[chainId],
      chainId: Number(chainId),
      tokenName: data.token_name,
      tokenSymbol: data.token_symbol,
      dex: dexList.map((d) => ({ name: d.name, liquidity: d.liquidity, pair: d.pair })),
      lpHolders: lpHolders.map((h) => ({
        address: h.address,
        tag: h.tag,
        percent: Number(h.percent || 0),
        isContract: h.is_contract === 1,
        isLocked: h.is_locked === 1,
        nftList: h.nft_list,
      })),
      lockedPercent: (lockedPercent * 100).toFixed(2),
      lockedHolderCount: lockedCount,
      totalLpHolders: lpHolders.length,
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
