"use client"

import { useState } from "react"

const C = {
  bg: "#090909",
  surface: "#111111",
  border: "#2a2a2a",
  text: "#dddddd",
  dim: "#909090",
  bright: "#efefef",
  green: "#4ade80",
  cyan: "#67e8f9",
  yellow: "#fbbf24",
  red: "#f87171",
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }
      style={{
        flexShrink: 0,
        background: "none",
        border: `1px solid ${copied ? C.green : C.border}`,
        color: copied ? C.green : C.dim,
        fontFamily: "inherit",
        fontSize: "11px",
        letterSpacing: "0.08em",
        padding: "2px 10px",
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s",
      }}
    >
      {copied ? "copied" : "copy"}
    </button>
  )
}

const HR = () => (
  <div style={{ borderTop: `1px solid ${C.border}`, margin: "36px 0" }} />
)

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ color: C.dim, fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "18px" }}>
    {children}
  </div>
)

const BASE = "https://honeypot.ivan-tempo.xyz"

const ENDPOINTS = [
  { path: "/api/check",        badge: "PAID", price: "$0.02",       desc: "isHoneypot · buy/sellTax · isOpenSource · isProxy · isMintable · ownerCanChangeBalance · hasBlacklist · antiWhale · transferPausable" },
  { path: "/api/check/deep",   badge: "PAID", price: "$0.04",       desc: "basic + LP analysis (lockedPercent, dex, pair) · top 10 holders · creator info · cannotSellAll · tradingCooldown · hiddenOwner" },
  { path: "/api/check/batch",  badge: "PAID", price: "$0.01/token", desc: "batch check up to 20 tokens · priceCharged = N×$0.01 · ?tokens=0x...,0x...&chain=" },
  { path: "/api/wallet-risk",  badge: "PAID", price: "$0.02",       desc: "address security: cybercrime · money_laundering · sanctioned · phishing · blackmail · riskScore 0–100" },
  { path: "/api/lp",           badge: "PAID", price: "$0.02",       desc: "LP details: dex · pair_address · liquidity · lp_holders · lockedPercent" },
  { path: "/api/info",         badge: "FREE", price: null,          desc: "service metadata · payment config · endpoint list" },
  { path: "/openapi.json",     badge: "FREE", price: null,          desc: "OpenAPI 3.1 spec · agent discovery" },
]

const COMMANDS = [
  { label: "check",       cmd: `curl '${BASE}/api/check?token=0xdac17f958d2ee523a2206206994597c13d831ec7&chain=1'` },
  { label: "deep",        cmd: `curl '${BASE}/api/check/deep?token=0xdac17f958d2ee523a2206206994597c13d831ec7&chain=1'` },
  { label: "batch",       cmd: `curl '${BASE}/api/check/batch?tokens=0xdac17f958d2ee523a2206206994597c13d831ec7,0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&chain=1'` },
  { label: "wallet risk", cmd: `curl '${BASE}/api/wallet-risk?address=0xd8da6bf26964af9d7eed9e03e53415d37aa96045&chain=1'` },
  { label: "lp",          cmd: `curl '${BASE}/api/lp?token=0xdac17f958d2ee523a2206206994597c13d831ec7&chain=1'` },
  { label: "discover",    cmd: `curl '${BASE}/openapi.json'` },
]

const CHAINS = [
  "ethereum (1)", "bsc (56)", "polygon (137)", "avalanche (43114)",
  "arbitrum (42161)", "optimism (10)", "base (8453)", "fantom (250)",
]

const PAYMENT_ROWS = [
  ["protocol", "x402 / Tempo MPP"],
  ["currency", "USDC.e · chainId 4217"],
  ["price", "$0.02 basic · $0.04 deep · $0.01/token batch"],
  ["gas", "abstracted — feePayer sponsored"],
  ["token", "0x20C000000000000000000000b9537d11c60E8b50"],
]

export default function Home() {
  return (
    <main
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "13px",
        lineHeight: "1.75",
        padding: "56px 24px 64px",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <div>
        <div style={{ fontSize: "26px", color: C.bright, fontWeight: "700", letterSpacing: "-0.01em" }}>
          honeypot
        </div>
        <div style={{ color: C.dim, marginTop: "6px", fontSize: "12px" }}>
          multi-chain token security checker &nbsp;·&nbsp; tempo MPP &nbsp;·&nbsp; x402
        </div>
        <div style={{ marginTop: "20px", display: "flex", gap: "20px", fontSize: "12px", flexWrap: "wrap" }}>
          <span><span style={{ color: C.green }}>●</span><span style={{ color: C.dim }}> live</span></span>
          <span style={{ color: C.dim }}>8 chains</span>
          <span style={{ color: C.dim }}>$0.02 / check</span>
          <span style={{ color: C.dim }}>gas-abstracted</span>
          <span style={{ color: C.red }}>GoPlus Security</span>
        </div>
      </div>

      <HR />

      <div>
        <Label>Endpoints</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {ENDPOINTS.map((e) => (
            <div key={e.path}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ color: C.cyan, fontSize: "11px", letterSpacing: "0.06em" }}>GET</span>
                <span style={{ color: C.bright }}>{e.path}</span>
                <span
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    padding: "1px 7px",
                    border: `1px solid ${e.badge === "PAID" ? C.yellow : C.green}`,
                    color: e.badge === "PAID" ? C.yellow : C.green,
                  }}
                >
                  {e.badge}{e.price ? ` · ${e.price}` : ""}
                </span>
              </div>
              <div style={{ color: C.dim, fontSize: "12px", marginTop: "2px" }}>{e.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <HR />

      <div>
        <Label>Quick start</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {COMMANDS.map((c) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                background: C.surface,
                padding: "9px 14px",
              }}
            >
              <div style={{ display: "flex", gap: "14px", alignItems: "baseline", minWidth: 0 }}>
                <span style={{ color: C.dim, fontSize: "11px", minWidth: "78px", flexShrink: 0 }}>{c.label}</span>
                <span style={{ color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px" }}>
                  $ {c.cmd}
                </span>
              </div>
              <CopyButton text={c.cmd} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: "14px", color: C.dim, fontSize: "12px", lineHeight: "1.8" }}>
          paid endpoints return 402 — attach x402 payment header with USDC.e
          <br />
          no native Tempo gas required &nbsp;·&nbsp; feePayer sponsored by service
        </div>
      </div>

      <HR />

      <div>
        <Label>Supported chains</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {CHAINS.map((chain) => (
            <span key={chain} style={{ color: C.text, fontSize: "12px", padding: "3px 10px", border: `1px solid ${C.border}` }}>
              {chain}
            </span>
          ))}
        </div>
      </div>

      <HR />

      <div>
        <Label>Payment</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
          {PAYMENT_ROWS.map(([k, v]) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "110px 1fr" }}>
              <span style={{ color: C.dim }}>{k}</span>
              <span style={{ color: C.text, wordBreak: "break-all" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <HR />

      <div style={{ display: "flex", gap: "20px", fontSize: "12px", flexWrap: "wrap" }}>
        {[
          { label: "openapi.json", href: "/openapi.json" },
          { label: "api/info", href: "/api/info" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{ color: C.dim, textDecoration: "none" }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = C.text)}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = C.dim)}
          >
            {l.label}
          </a>
        ))}
      </div>
    </main>
  )
}
