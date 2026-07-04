import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme as ExactEvmServerScheme } from "@x402/evm/exact/server";
import { ExactEvmScheme as ExactEvmClientScheme } from "@x402/evm/exact/client";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

config({ path: new URL("../.env", import.meta.url) });

const PORT = process.env.PORT || 4021;
const BASE_SEPOLIA = "eip155:84532";
const PRICE = "$0.02";
// Substrings matched against the real User-Agent strings these crawlers send
// (verified against openai.com/gptbot, /bot, /searchbot docs). ChatGPT-User is
// what ChatGPT itself sends when it fetches a link on a user's behalf.
const KNOWN_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];
const CHATGPT_USER_AGENT =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot";

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
    new x402ResourceServer(facilitatorClient).register(BASE_SEPOLIA, new ExactEvmServerScheme()),
  ),
);

app.get("/premium/artikel-42", (req, res) => {
  res.json(PREMIUM_ARTICLE);
});

app.get("/api/events", (req, res) => {
  res.json(events);
});

const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;

async function simulateAgentVisit(privateKey, agentName) {
  const signer = privateKeyToAccount(privateKey);
  const client = new x402Client();
  client.register(BASE_SEPOLIA, new ExactEvmClientScheme(signer));
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);
  const headers = { "X-Agent-Name": agentName, "User-Agent": "GPTBot" };

  const res = await fetchWithPayment(`http://localhost:${PORT}/premium/artikel-42`, { headers });
  const paid = res.status === 200;
  return {
    agent: agentName,
    status: paid ? "paid" : "blocked",
    httpStatus: res.status,
    content: paid ? await res.json() : null,
  };
}

app.post("/api/simulate-agent", async (req, res) => {
  if (!agentPrivateKey) {
    return res.status(400).json({ error: "AGENT_PRIVATE_KEY ontbreekt" });
  }
  try {
    const result = await simulateAgentVisit(agentPrivateKey, "dashboard-demo-agent");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/simulate-agent-broke", async (req, res) => {
  try {
    const result = await simulateAgentVisit(generatePrivateKey(), "dashboard-broke-agent");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A generic AI has no wallet at all, so this is a plain fetch — no x402
// client, no signer, nothing to retry with. It sends ChatGPT's real
// User-Agent, so it hits exactly the same wall a live ChatGPT browse would.
app.post("/api/simulate-generic-ai", async (req, res) => {
  try {
    const r = await fetch(`http://localhost:${PORT}/premium/artikel-42`, {
      headers: { "X-Agent-Name": "Generieke AI (ChatGPT)", "User-Agent": CHATGPT_USER_AGENT },
    });
    res.json({
      agent: "Generieke AI (ChatGPT)",
      status: r.status === 200 ? "paid" : "blocked",
      httpStatus: r.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Site draait op http://localhost:${PORT}`);
});
