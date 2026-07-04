import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

config({ path: new URL("../.env", import.meta.url) });

const PORT = 4021;
const BASE_SEPOLIA = "eip155:84532";

const payTo = process.env.PUBLISHER_ADDRESS;
const facilitatorUrl = process.env.FACILITATOR_URL;

if (!payTo || !facilitatorUrl) {
  console.error("Missing PUBLISHER_ADDRESS or FACILITATOR_URL in .env");
  process.exit(1);
}

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

const app = express();

app.use(
  paymentMiddleware(
    {
      "GET /premium/artikel-42": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.02",
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
  res.json({
    title: "De toekomst van AI-agents en het open web",
    author: "CreatorShield",
    body: "Dit is premium content die alleen zichtbaar zou moeten zijn na betaling. Vandaag staat de deur nog open.",
  });
});

app.listen(PORT, () => {
  console.log(`Site draait op http://localhost:${PORT}`);
});
