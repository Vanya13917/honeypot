import { NextResponse } from "next/server"
import { mppx, PRICES } from "@/lib/mpp"
import { goPlusCache } from "@/lib/cache"
import { fetchAddressSecurity, CHAIN_IDS, CHAIN_NAMES } from "@/lib/goplus"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const address = url.searchParams.get("address")?.toLowerCase()
  const chainParam = url.searchParams.get("chain") || "1"

  const result = await mppx.charge({ amount: "0.02" })(request)
  if (result.status === 402) return result.challenge

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return result.withReceipt(NextResponse.json({ error: "invalid_address" }, { status: 400 }))
  }

  const chainId = CHAIN_IDS[chainParam.toLowerCase()] || chainParam
  if (!CHAIN_NAMES[chainId]) {
    return result.withReceipt(NextResponse.json({ error: "unsupported_chain" }, { status: 400 }))
  }

  const cacheKey = `wallet:${address}:${chainId}`
  const cached = goPlusCache.get(cacheKey)
  if (cached) return result.withReceipt(NextResponse.json({ ...cached, cached: true }))

  try {
    const data = await fetchAddressSecurity(address, chainId)

    const flagValues = [
      data.cybercrime === "1",
      data.money_laundering === "1",
      Number(data.number_of_malicious_contracts_created || 0) > 0,
      data.financial_crime === "1",
      data.darkweb_transactions === "1",
      data.phishing_activities === "1",
      data.blackmail_activities === "1",
      data.sanctioned === "1",
      data.stealing_attack === "1",
      data.fake_kyc === "1",
    ]
    const flagCount = flagValues.filter(Boolean).length
    const score = Math.min(100, flagCount * 10)

    const payload = {
      address,
      chain: CHAIN_NAMES[chainId],
      chainId: Number(chainId),
      riskScore: score,
      riskLevel: score === 0 ? "clean" : score < 30 ? "low" : score < 60 ? "medium" : "high",
      flags: {
        cybercrime: data.cybercrime === "1",
        moneyLaundering: data.money_laundering === "1",
        sanctioned: data.sanctioned === "1",
        phishing: data.phishing_activities === "1",
        blackmail: data.blackmail_activities === "1",
        darkwebTransactions: data.darkweb_transactions === "1",
        financialCrime: data.financial_crime === "1",
        stealingAttack: data.stealing_attack === "1",
        fakeKyc: data.fake_kyc === "1",
        maliciousContracts: Number(data.number_of_malicious_contracts_created || 0),
      },
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
