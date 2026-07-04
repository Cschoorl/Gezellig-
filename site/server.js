import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

config({ path: new URL("../.env", import.meta.url) });

const PORT = 4021;
const BASE_SEPOLIA = "eip155:84532";
const PRICE = "$0.02";
const KNOWN_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];

const PREMIUM_ARTICLE = {
  title: "De toekomst van AI-agents en het open web",
  author: "CreatorShield",
  body: "Dit is premium content die alleen zichtbaar zou moeten zijn na betaling. Vandaag staat de deur nog open.",
};

function isKnownBot(userAgent) {
  if (!userAgent) return false;
  return KNOWN_BOTS.some(bot => userAgent.includes(bot));
}

const payTo = process.env.PUBLISHER_ADDRESS;
const facilitatorUrl = process.env.FACILITATOR_URL;

if (!payTo || !facilitatorUrl) {
  console.error("Missing PUBLISHER_ADDRESS or FACILITATOR_URL in .env");
  process.exit(1);
}

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

const app = express();
app.use(cors());

const events = [];

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  res.on("finish", () => {
    if (req.path !== "/premium/artikel-42") return;

    let status;
    if (res.locals.creatorshieldStatus) status = res.locals.creatorshieldStatus;
    else if (res.statusCode === 200) status = "paid";
    else if (res.statusCode === 402) status = "blocked";
    else status = "failed";

    let transaction = null;
    const paymentResponseHeader = res.getHeader("PAYMENT-RESPONSE");
    if (paymentResponseHeader) {
      try {
        const decoded = JSON.parse(Buffer.from(paymentResponseHeader, "base64").toString("utf-8"));
        transaction = decoded.transaction ?? null;
      } catch {
        transaction = null;
      }
    }

    events.push({
      status,
      agent: req.get("x-agent-name") || "onbekend",
      page: req.path,
      amount: PRICE,
      transaction,
      timestamp,
    });
  });
  next();
});

app.get("/premium/artikel-42", (req, res, next) => {
  if (isKnownBot(req.get("user-agent"))) return next();
  res.locals.creatorshieldStatus = "free";
  res.json(PREMIUM_ARTICLE);
});

app.use(
  paymentMiddleware(
    {
      "GET /premium/artikel-42": {
        accepts: [
          {
            scheme: "exact",
            price: PRICE,
            network: BASE_SEPOLIA,
            payTo,
          },
        ],
        description: "Premium artikel",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient).register(BASE_SEPOLIA, new ExactEvmScheme()),
  ),
);

app.get("/premium/artikel-42", (req, res) => {
  res.json(PREMIUM_ARTICLE);
});

app.get("/api/events", (req, res) => {
  res.json(events);
});

app.listen(PORT, () => {
  console.log(`Site draait op http://localhost:${PORT}`);
});
