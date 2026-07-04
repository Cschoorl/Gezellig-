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

## Testen via GitHub Codespaces (geen lokale installatie nodig)

1. Ga naar de repo-instellingen: **Settings → Secrets and variables → Codespaces**.
2. Voeg deze 6 repository secrets toe (waardes uit je eigen lokale `.env`):
   `NETWORK`, `FACILITATOR_URL`, `PUBLISHER_ADDRESS`, `PUBLISHER_PRIVATE_KEY`,
   `AGENT_ADDRESS`, `AGENT_PRIVATE_KEY`. Zo gebruikt de Codespace dezelfde,
   al-gefinancierde testnet-wallets — geen `.env`-bestand nodig, Codespaces
   zet secrets automatisch als environment variables.
3. Ga naar de hoofdpagina van de repo → knop **Code** → tab **Codespaces** →
   **Create codespace on main**.
4. Wacht tot de setup klaar is (installeert automatisch alle dependencies).
   Open dan in de Codespace-terminal:
   ```bash
   npm run dev
   ```
5. Codespaces stuurt poort 4022 (dashboard) automatisch door en toont een
   voorbeeld-URL/pop-up — open die. Voor het robotje: open een tweede
   terminal-tab in de Codespace en draai `cd agent && node index.js`.

## Draaien

Eenmalig installeren:

```bash
npm install
(cd site && npm install)
(cd dashboard && npm install)
(cd agent && npm install)
```

Stack starten (server + dashboard in één commando):

```bash
npm run dev
```

Open http://localhost:4022 voor het live dashboard, of
http://localhost:4021/premium/artikel-42 voor de ruwe endpoint.

Het robotje draai je apart, in een eigen terminal:

```bash
cd agent
node index.js            # betaalt en krijgt de content: 402 -> betaald -> 200
node index.js --broke     # ongefinancierde wallet: blijft op 402 hangen
```

## Demo-script (~90 sec)

1. Open het dashboard in de browser — gewoon zichtbaar, mensen komen gratis binnen.
2. `curl -A "Mozilla/5.0" http://localhost:4021/premium/artikel-42` — een browser krijgt de content gratis.
3. `cd agent && node index.js` — het robotje (met een bot-user-agent) botst op de muur, betaalt $0.02 USDC en krijgt de content. Het dashboard springt live omhoog.
4. `node index.js --broke` — een robotje zonder testnet-geld blijft op 402 hangen.
5. Sluit af met het dashboard: "dít scorebord is onze salespitch aan elke uitgever."

## Status

- [x] Stap 0 — project-scaffolding + testnet wallets
- [x] Stap 1 — premium-endpoint zonder muur
- [x] Stap 2 — x402-betaalmuur voor het endpoint
- [x] Stap 3 — agent leest de 402-instructies
- [x] Stap 4 — agent betaalt en krijgt de content
- [x] Stap 5 — bezoeken loggen
- [x] Stap 6 — live dashboard
- [x] Stap 7 — mensen gratis, bots betalen
- [x] Stap 8 — poetsen: één commando voor de stack, blocked-demo, README
