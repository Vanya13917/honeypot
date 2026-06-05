import { Mppx, tempo } from "mppx/server"
import { privateKeyToAccount } from "viem/accounts"

const USDC_E = "0x20C000000000000000000000b9537d11c60E8b50" as const

export const mppx = Mppx.create({
  realm: process.env.MPP_REALM ?? "honeypot.ivan-tempo.xyz",
  methods: [
    tempo.charge({
      currency: USDC_E,
      recipient: process.env.MPP_RECIPIENT as `0x${string}`,
      account: privateKeyToAccount(
        process.env.MPP_FEE_PAYER_PRIVATE_KEY as `0x${string}`
      ),
      feePayer: true,
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
