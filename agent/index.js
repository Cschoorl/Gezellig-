import { config } from "dotenv";
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

config({ path: new URL("../.env", import.meta.url) });

const BASE_SEPOLIA = "eip155:84532";
const URL_TO_FETCH = "http://localhost:4021/premium/artikel-42";

const isBroke = process.argv.includes("--broke");
const AGENT_NAME = isBroke ? "creatorshield-broke-agent" : "creatorshield-demo-agent";

// --broke gebruikt een verse, ongefinancierde wallet: laat zien dat een
// robotje zonder testnet-geld gewoon op 402 blijft hangen.
const agentPrivateKey = isBroke ? generatePrivateKey() : process.env.AGENT_PRIVATE_KEY;
if (!agentPrivateKey) {
  console.error("Missing AGENT_PRIVATE_KEY in .env");
  process.exit(1);
}

const signer = privateKeyToAccount(agentPrivateKey);
if (isBroke) {
  console.log(`Robotje zonder geld (adres: ${signer.address}, saldo: 0)\n`);
}

// User-Agent doet zich voor als GPTBot: laat zien dat de muur bot-verkeer
// herkent (en dat dat op user-agent zelf niet te vertrouwen is).
const headers = { "X-Agent-Name": AGENT_NAME, "User-Agent": "GPTBot" };

console.log("1) Onbetaald verzoek...");
const unpaidRes = await fetch(URL_TO_FETCH, { headers });
console.log("   Status:", unpaidRes.status);

console.log("2) Betalen via x402...");
const client = new x402Client();
client.register(BASE_SEPOLIA, new ExactEvmScheme(signer));
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const paidRes = await fetchWithPayment(URL_TO_FETCH, { headers });
console.log("   Status:", paidRes.status);

if (paidRes.status === 200) {
  const content = await paidRes.json();
  console.log("   Content:", content);
} else {
  console.log("   Geen content — betaling niet gelukt, robotje blijft op 402 hangen.");
}

console.log("3) Resultaat:");
try {
  const settleResponse = new x402HTTPClient(client).getPaymentSettleResponse(name =>
    paidRes.headers.get(name),
  );
  console.log(JSON.stringify(settleResponse, null, 2));
} catch {
  console.log("Geen PAYMENT-RESPONSE header — de betaling is nooit bij de facilitator aangekomen.");
}
