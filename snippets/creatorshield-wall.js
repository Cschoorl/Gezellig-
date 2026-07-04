// CreatorShield x402-muur — plak dit bestand in je eigen Express-project.
// Installeer eerst: npm install @x402/express @x402/evm @x402/core
//
// Gebruik:
//   import { creatorShieldWall } from "./creatorshield-wall.js";
//
//   app.get(
//     "/mijn-artikel",
//     creatorShieldWall({
//       route: "/mijn-artikel",
//       price: "$0.02",
//       payTo: "0x4a304e7217547Fe5c9FFe236F3b61A9aC03DcEEf", // jouw ontvangadres
//     }),
//     (req, res) => res.json({ title: "Mijn artikel", body: "..." }),
//   );
//
// Mensen (elke normale browser) lezen gratis door. Alleen bekende AI-bots
// (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, PerplexityBot,
// Google-Extended) krijgen de betaalmuur voorgeschoteld.

import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const KNOWN_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

function isKnownBot(userAgent) {
  return !!userAgent && KNOWN_BOTS.some(bot => userAgent.includes(bot));
}

/**
 * @param {object} opts
 * @param {string} opts.route - het pad dat je beschermt, bv. "/mijn-artikel" (moet gelijk zijn aan waar je 'm op mount)
 * @param {string} opts.price - bv. "$0.02"
 * @param {string} opts.payTo - het wallet-adres dat de betaling ontvangt
 * @param {string} [opts.method] - HTTP-methode, standaard "GET"
 * @param {string} [opts.network] - CAIP-2 netwerk-id, standaard Base Sepolia testnet
 * @param {string} [opts.facilitatorUrl] - x402-facilitator, standaard de gratis publieke testnet-facilitator
 * @param {string} [opts.description] - omschrijving die in de 402-instructies verschijnt
 */
export function creatorShieldWall({
  route,
  price,
  payTo,
  method = "GET",
  network = "eip155:84532",
  facilitatorUrl = "https://x402.org/facilitator",
  description = "Premium content",
}) {
  if (!route || !price || !payTo) {
    throw new Error("creatorShieldWall vereist route, price en payTo");
  }

  const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    network,
    new ExactEvmScheme(),
  );

  const wall = paymentMiddleware(
    {
      [`${method} ${route}`]: {
        accepts: [{ scheme: "exact", price, network, payTo }],
        description,
        mimeType: "application/json",
      },
    },
    resourceServer,
  );

  return (req, res, next) => {
    if (!isKnownBot(req.get("user-agent"))) return next();
    return wall(req, res, next);
  };
}
