import { Mppx, tempo } from "mppx/server"
import { privateKeyToAccount } from "viem/accounts"

const USDC_E = "0x20C000000000000000000000b9537d11c60E8b50" as const

// Fallback key used only during Next.js build (env absent); real key loaded at runtime.
const feePayerKey = (process.env.MPP_FEE_PAYER_PRIVATE_KEY ||
  "0x0000000000000000000000000000000000000000000000000000000000000001") as `0x${string}`

export const mppx = Mppx.create({
  secretKey: process.env.MPP_SECRET_KEY || "0000000000000000000000000000000000000000000000000000000000000000",
  methods: [
    tempo.charge({
      currency: USDC_E,
      recipient: (process.env.MPP_RECIPIENT ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`,
      account: privateKeyToAccount(feePayerKey),
      feePayer: true,
    }),
  ],
})

// Decimal strings — mppx handles 6-decimal USDC.e conversion internally
// openapi.json uses base units: $0.01=10000, $0.02=20000, $0.04=40000
export const PRICES = {
  basic: "0.02",
  deep: "0.04",
  batch: "0.01",
  walletRisk: "0.02",
  lp: "0.02",
} as const
