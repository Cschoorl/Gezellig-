# CreatorShield

Hackathon-demo: een x402-betaalmuur voor content, zodat AI-agents micro-betalen
voor toegang terwijl mensen gratis binnen blijven komen.

- `site/` — Express-server die het premium-artikel serveert achter een x402-betaalmuur (mensen gratis, bots betalen)
- `agent/` — script dat als AI-agent het artikel opvraagt en betaalt via x402
- `dashboard/` — live scorebord van betaalde/gratis/geblokkeerde bezoeken
- `scripts/generate-wallets.mjs` — genereert de publisher- en agent-testnetwallets

## Netwerk

Base Sepolia (testnet). De agent-wallet heeft testnet ETH (gas) en testnet USDC
(betaalmiddel) nodig — beide te verkrijgen via de [CDP faucet](https://portal.cdp.coinbase.com/products/faucet).

## Setup

```bash
npm install
node scripts/generate-wallets.mjs   # genereert .env met publisher/agent wallets (eenmalig)
```

`.env` wordt nooit gecommit.

## Draaien

```bash
cd site && npm install && npm start        # poort 4021
cd dashboard && npm install && npm start   # poort 4022
cd agent && npm install && node index.js   # robotje: 402 -> betaald -> 200
```

Open http://localhost:4022 voor het live dashboard, of
http://localhost:4021/premium/artikel-42 voor de ruwe endpoint.

## Status

- [x] Stap 0 — project-scaffolding + testnet wallets
- [x] Stap 1 — premium-endpoint zonder muur
- [x] Stap 2 — x402-betaalmuur voor het endpoint
- [x] Stap 3 — agent leest de 402-instructies
- [x] Stap 4 — agent betaalt en krijgt de content
- [x] Stap 5 — bezoeken loggen
- [x] Stap 6 — live dashboard
- [x] Stap 7 — mensen gratis, bots betalen
