// CreatorShield x402-muur voor Next.js App Router (Route Handlers).
// Installeer eerst: npm install @x402/core @x402/evm
//
// Gebruik in app/jouw-route/route.ts:
//
//   import { creatorShieldWall } from "@/lib/creatorshield-wall";
//
//   async function handler(request: Request) {
//     return Response.json({ title: "...", body: "..." });
//   }
//
//   export const GET = creatorShieldWall(handler, {
//     route: "/jouw-route",
//     price: "$0.02",
//     payTo: "0x4a304e7217547Fe5c9FFe236F3b61A9aC03DcEEf",
//   });
//
// Mensen (elke normale browser) komen ongemoeid door — de handler wordt
// direct aangeroepen. Alleen bekende AI-bots (GPTBot, ChatGPT-User,
// OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended) krijgen de
// x402-muur voorgeschoteld.

import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import type { PaymentRequirements } from "@x402/core/types";

const KNOWN_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

function isKnownBot(userAgent: string | null): boolean {
  return !!userAgent && KNOWN_BOTS.some(bot => userAgent.includes(bot));
}

type WallOptions = {
  /** Het pad dat je beschermt, bv. "/jouw-route" (alleen gebruikt in de 402-instructies, niet voor matching). */
  route: string;
  /** Bv. "$0.02" */
  price: string;
  /** Het wallet-adres dat de betaling ontvangt. */
  payTo: string;
  network?: string;
  facilitatorUrl?: string;
  description?: string;
  mimeType?: string;
};

type ResourceServerEntry = { server: x402ResourceServer; ready: Promise<void> };

const resourceServerCache = new Map<string, ResourceServerEntry>();

function getResourceServer(facilitatorUrl: string, network: string): ResourceServerEntry {
  const cacheKey = `${facilitatorUrl}|${network}`;
  let entry = resourceServerCache.get(cacheKey);
  if (!entry) {
    const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
    const server = new x402ResourceServer(facilitatorClient).register(network, new ExactEvmScheme());
    // Route Handlers have no startup hook (each invocation can be a cold
    // start), so we sync supported schemes from the facilitator lazily on
    // first use instead, and cache the promise so warm invocations reuse it.
    const ready = server.initialize().then(() => undefined);
    entry = { server, ready };
    resourceServerCache.set(cacheKey, entry);
  }
  return entry;
}

/**
 * Wrap een Next.js App Router Route Handler (de GET/POST-export) met een
 * x402-betaalmuur. Retourneert een nieuwe handler-functie die je direct
 * exporteert.
 */
export function creatorShieldWall(
  handler: (request: Request) => Promise<Response> | Response,
  options: WallOptions,
) {
  const {
    price,
    payTo,
    network = "eip155:84532",
    facilitatorUrl = "https://x402.org/facilitator",
    description = "Premium content",
    mimeType = "application/json",
  } = options;

  const { server: resourceServer, ready } = getResourceServer(facilitatorUrl, network);
  const routeConfig = { scheme: "exact" as const, price, network, payTo, description, mimeType };
  let cachedRequirements: PaymentRequirements | null = null;

  return async function wrapped(request: Request): Promise<Response> {
    const userAgent = request.headers.get("user-agent");
    if (!isKnownBot(userAgent)) {
      return handler(request);
    }

    await ready;

    if (!cachedRequirements) {
      const built = await resourceServer.buildPaymentRequirements(routeConfig);
      if (built.length === 0) {
        return Response.json({ error: "Server configuration error" }, { status: 500 });
      }
      cachedRequirements = built[0];
    }

    const paymentHeader =
      request.headers.get("payment-signature") || request.headers.get("x-payment");

    if (!paymentHeader) {
      const paymentRequired = await resourceServer.createPaymentRequiredResponse(
        [cachedRequirements],
        { url: request.url, description, mimeType },
        "Payment required",
      );
      const requirementsHeader = Buffer.from(JSON.stringify(paymentRequired)).toString("base64");
      return new Response(JSON.stringify({ error: "Payment Required" }), {
        status: 402,
        headers: { "content-type": "application/json", "PAYMENT-REQUIRED": requirementsHeader },
      });
    }

    const paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
    const verifyResult = await resourceServer.verifyPayment(paymentPayload, cachedRequirements);

    if (!verifyResult.isValid) {
      return Response.json(
        { error: "Invalid Payment", reason: verifyResult.invalidReason },
        { status: 402 },
      );
    }

    const response = await handler(request);

    try {
      const settleResult = await resourceServer.settlePayment(paymentPayload, cachedRequirements);
      const settlementHeader = Buffer.from(JSON.stringify(settleResult)).toString("base64");
      const headers = new Headers(response.headers);
      headers.set("PAYMENT-RESPONSE", settlementHeader);
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return response;
    }
  };
}
