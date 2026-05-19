import { Mppx, tempo } from "mppx/server"
import { privateKeyToAccount } from "viem/accounts"
import { createClient, http } from "viem"

const USDC_E = "0x20C000000000000000000000b9537d11c60E8b50" as const

// Wrap the viem client so that eth_call simulation failures caused by an
// already-registered keychain key are swallowed. The Tempo keychain precompile
// rejects simulation with KeyAlreadyExists when the agent's key is already on
// chain, but the actual broadcast succeeds — the chain is idempotent here.
function getClient({ chainId: _chainId }: { chainId?: number } = {}) {
  console.log('[DEBUG getClient] called')
  const client = createClient({ transport: http("https://rpc.tempo.xyz") })
  const orig = client.request.bind(client)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(client as any).request = async (args: { method: string; params?: unknown[] }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstParam = (args.params?.[0] as any) || {}
    console.log('[DEBUG getClient] request', {
      method: args.method,
      paramsKeys: args.params ? Object.keys(firstParam) : [],
    })
    try {
      return await orig(args as Parameters<typeof orig>[0])
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any
      const errStr = String(err)
      console.log('[DEBUG getClient] error caught', {
        method: args.method,
        errorMessage: errStr.slice(0, 500),
        errorName: e?.name,
        errorConstructor: e?.constructor?.name,
        hasKeyAlreadyExists: errStr.includes('KeyAlreadyExists'),
        hasShortDetails: String(e?.shortMessage || ''),
        errCause: e?.cause ? String(e.cause).slice(0, 300) : null,
      })
      if (args.method === "eth_call" && errStr.includes("KeyAlreadyExists")) {
        console.log('[DEBUG getClient] BYPASSED')
        return "0x"
      }
      console.log('[DEBUG getClient] RETHROWN: ' + errStr.slice(0, 200))
      throw err
    }
  }
  return client
}

export const mppx = Mppx.create({
  methods: [
    tempo.charge({
      currency: USDC_E,
      recipient: process.env.MPP_RECIPIENT as `0x${string}`,
      account: privateKeyToAccount(
        process.env.MPP_FEE_PAYER_PRIVATE_KEY as `0x${string}`
      ),
      feePayer: true,
      getClient,
    }),
  ],
})

export const PRICES = {
  basic: "0.02",
  deep: "0.04",
  batch: "0.01",
  walletRisk: "0.02",
  lp: "0.02",
} as const
