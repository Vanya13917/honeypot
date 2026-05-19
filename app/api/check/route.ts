import { NextResponse } from "next/server"
import { mppx, PRICES } from "@/lib/mpp"
import { goPlusCache } from "@/lib/cache"
import { fetchTokenSecurity, CHAIN_IDS, CHAIN_NAMES } from "@/lib/goplus"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request): Promise<Response> {
  console.log('[DEBUG] check route called', { headers: Object.fromEntries(request.headers), url: request.url })

  // Payment FIRST — MPPScan probes this without params and expects 402
  const result = await mppx.charge({ amount: PRICES.basic })(request)

  console.log('[DEBUG] charge result', { status: result?.status })
  if (result.status === 402) {
    const clone = result.challenge.clone()
    const body = await clone.text()
    console.log('[DEBUG] verification failed body', body)
    return result.challenge
  }

  const url = new URL(request.url)
  const token = url.searchParams.get("token")?.toLowerCase()
  const chainParam = url.searchParams.get("chain") || "1"

  if (!token || !/^0x[a-fA-F0-9]{40}$/.test(token)) {
    return result.withReceipt(
      NextResponse.json({ error: "invalid_token", message: "token must be a valid 0x address" }, { status: 400 })
    )
  }

  const chainId = CHAIN_IDS[chainParam.toLowerCase()] || chainParam
  if (!CHAIN_NAMES[chainId]) {
    return result.withReceipt(
      NextResponse.json({ error: "unsupported_chain", message: "supported: 1,56,137,43114,42161,10,8453,250" }, { status: 400 })
    )
  }

  const cacheKey = `basic:${token}:${chainId}`
  const cached = goPlusCache.get(cacheKey)
  if (cached) return result.withReceipt(NextResponse.json({ ...cached, cached: true }))

  try {
    const data = await fetchTokenSecurity(token, chainId)
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
      tokenName: data.token_name,
      tokenSymbol: data.token_symbol,
      holderCount: data.holder_count != null ? Number(data.holder_count) : null,
      totalSupply: data.total_supply,
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
