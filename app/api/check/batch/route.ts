import { NextResponse } from "next/server"
import { mppx, PRICES } from "@/lib/mpp"
import { goPlusCache } from "@/lib/cache"
import { fetchTokenSecurity, CHAIN_IDS, CHAIN_NAMES } from "@/lib/goplus"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request): Promise<Response> {
  console.log('[DEBUG] batch route called', { headers: Object.fromEntries(request.headers), url: request.url })

  // Parse token count first to compute dynamic price, then charge
  const url = new URL(request.url)
  const tokensParam = url.searchParams.get("tokens") || ""
  const rawTokens = tokensParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
  const validTokens = rawTokens.filter((t) => /^0x[a-fA-F0-9]{40}$/.test(t)).slice(0, 20)
  const count = Math.max(validTokens.length, 1)
  const price = (count * Number(PRICES.batch)).toFixed(2)

  const result = await mppx.charge({ amount: price })(request)

  console.log('[DEBUG] batch charge result', { status: result?.status })
  if (result.status === 402) {
    const clone = result.challenge.clone()
    const body = await clone.text()
    console.log('[DEBUG] batch verification failed body', body)
    return result.challenge
  }

  const chainParam = url.searchParams.get("chain") || "1"
  const chainId = CHAIN_IDS[chainParam.toLowerCase()] || chainParam

  if (validTokens.length === 0) {
    return result.withReceipt(
      NextResponse.json(
        { error: "no_valid_tokens", message: "provide comma-separated 0x addresses in ?tokens=" },
        { status: 400 }
      )
    )
  }

  if (!CHAIN_NAMES[chainId]) {
    return result.withReceipt(NextResponse.json({ error: "unsupported_chain" }, { status: 400 }))
  }

  const results = await Promise.allSettled(
    validTokens.map(async (token) => {
      const cacheKey = `basic:${token}:${chainId}`
      const cached = goPlusCache.get(cacheKey) as Record<string, unknown> | undefined
      if (cached) return { ...cached, cached: true }

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
      }
      goPlusCache.set(cacheKey, payload)
      return payload
    })
  )

  const items = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { token: validTokens[i], error: (r.reason as Error).message }
  )

  return result.withReceipt(
    NextResponse.json({ count: validTokens.length, priceCharged: `$${price}`, items })
  )
}
