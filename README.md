# CreatorShield

Hackathon-demo: een x402-betaalmuur voor content, zodat AI-agents micro-betalen
voor toegang terwijl mensen gratis binnen blijven komen.

- `site/` — Express-server die het premium-artikel serveert (straks achter de x402-muur)
- `agent/` — script dat als AI-agent het artikel opvraagt en (straks) betaalt via x402
- `dashboard/` — live scorebord van betaalde/geblokkeerde bezoeken
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
cd site && npm install && npm start
```

Open http://localhost:4021/premium/artikel-42

## Status

- [x] Stap 0 — project-scaffolding + testnet wallets
- [x] Stap 1 — premium-endpoint zonder muur
- [ ] Stap 2 — x402-betaalmuur voor het endpoint
- [ ] Stap 3 — agent leest de 402-instructies
- [ ] Stap 4 — agent betaalt en krijgt de content
- [ ] Stap 5 — bezoeken loggen
- [ ] Stap 6 — live dashboard
- [ ] Stap 7 — mensen gratis, bots betalen
