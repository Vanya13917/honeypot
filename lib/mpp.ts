import { Mppx, tempo } from "mppx/server"
import { createClient, http } from "viem"
import { tempo as tempoChain } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

const USDC_E = "0x20C000000000000000000000b9537d11c60E8b50" as const

const feePayerKey = (process.env.MPP_FEE_PAYER_PRIVATE_KEY ||
  "0x0000000000000000000000000000000000000000000000000000000000000001") as `0x${string}`

// Tempo RPC returns KeyAlreadyExists when a secp256k1 session key in keyAuthorization
// is already registered on the account keychain. This happens after the first successful
// payment — the agent includes keyAuthorization on every tx even though the key is set.
// The error surfaces during eth_call simulation and prevents feePayer verification.
// Fix: catch KeyAlreadyExists in simulation, strip keyAuthorization, retry. The actual
// sendRawTransactionSync still includes it, which Tempo processes idempotently.
const getTempoClient = async ({ chainId }: { chainId?: number } = {}) => {
  const chain = { ...tempoChain, id: chainId ?? 4217 }
  const client = createClient({ chain, transport: http("https://rpc.tempo.xyz") })
  const origRequest = client.request.bind(client)
  return Object.assign(client, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: async (args: any) => {
      if (args.method !== "eth_call") return origRequest(args)
      try {
        return await origRequest(args)
      } catch (err: unknown) {
        const msg =
          (err as { details?: string })?.details ??
          (err as { cause?: { details?: string } })?.cause?.details ??
          (err as { message?: string })?.message ??
          ""
        if (typeof msg === "string" && msg.includes("KeyAlreadyExists")) {
          // Strip keyAuthorization and retry simulation only
          const [txParams, ...rest] = args.params ?? []
          if (txParams?.keyAuthorization) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { keyAuthorization: _ka, ...cleanParams } = txParams
            return origRequest({ ...args, params: [cleanParams, ...rest] })
          }
        }
        throw err
      }
    },
  })
}

export const mppx = Mppx.create({
  methods: [
    tempo.charge({
      currency: USDC_E,
      recipient: (process.env.MPP_RECIPIENT ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
      account: privateKeyToAccount(feePayerKey),
      feePayer: true,
      getClient: getTempoClient,
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
