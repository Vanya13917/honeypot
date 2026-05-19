import { Mppx, tempo } from "mppx/server"
import { privateKeyToAccount } from "viem/accounts"
import { createClient, http } from "viem"

const USDC_E = "0x20C000000000000000000000b9537d11c60E8b50" as const

// Wrap the viem client so that eth_call simulation failures caused by an
// already-registered keychain key are swallowed. The Tempo keychain precompile
// rejects simulation with KeyAlreadyExists when the agent's key is already on
// chain, but the actual broadcast succeeds — the chain is idempotent here.
function getClient({ chainId: _chainId }: { chainId?: number } = {}) {
  const client = createClient({ transport: http("https://rpc.tempo.xyz") })
  const orig = client.request.bind(client)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(client as any).request = async (args: { method: string; params?: unknown[] }) => {
    try {
      return await orig(args as Parameters<typeof orig>[0])
    } catch (err) {
      if (args.method === "eth_call" && String(err).includes("KeyAlreadyExists")) {
        return "0x"
      }
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
