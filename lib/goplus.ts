const GOPLUS_BASE = "https://api.gopluslabs.io/api/v1"

export const CHAIN_IDS: Record<string, string> = {
  "1": "1", "56": "56", "137": "137", "43114": "43114",
  "42161": "42161", "10": "10", "8453": "8453", "250": "250",
  ethereum: "1", eth: "1",
  bsc: "56", bnb: "56",
  polygon: "137", matic: "137",
  avalanche: "43114", avax: "43114",
  arbitrum: "42161", arb: "42161",
  optimism: "10", op: "10",
  base: "8453",
  fantom: "250", ftm: "250",
}

export const CHAIN_NAMES: Record<string, string> = {
  "1": "ethereum", "56": "bsc", "137": "polygon",
  "43114": "avalanche", "42161": "arbitrum", "10": "optimism",
  "8453": "base", "250": "fantom",
}

type GoPlusResult = Record<string, unknown>

function buildHeaders(): HeadersInit {
  const key = process.env.GOPLUS_API_KEY
  return key ? { Authorization: key } : {}
}

export async function fetchTokenSecurity(token: string, chainId: string): Promise<GoPlusResult> {
  const url = `${GOPLUS_BASE}/token_security/${chainId}?contract_addresses=${token}`
  const res = await fetch(url, { headers: buildHeaders() })
  if (!res.ok) throw new Error(`GoPlus HTTP ${res.status}`)
  const json = await res.json() as { result: Record<string, GoPlusResult>; code: number; message: string }
  if (json.code !== 1) throw new Error(`GoPlus: ${json.message}`)
  const data = json.result[token.toLowerCase()]
  if (!data) throw new Error(`Token not found on chain ${chainId}`)
  return data
}

export async function fetchAddressSecurity(address: string, chainId: string): Promise<GoPlusResult> {
  const url = `${GOPLUS_BASE}/address_security/${address}?chain_id=${chainId}`
  const res = await fetch(url, { headers: buildHeaders() })
  if (!res.ok) throw new Error(`GoPlus HTTP ${res.status}`)
  const json = await res.json() as { result: GoPlusResult; code: number; message: string }
  if (json.code !== 1) throw new Error(`GoPlus: ${json.message}`)
  return json.result
}
