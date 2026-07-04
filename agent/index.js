import { config } from "dotenv";
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

config({ path: new URL("../.env", import.meta.url) });

const BASE_SEPOLIA = "eip155:84532";
const URL_TO_FETCH = "http://localhost:4021/premium/artikel-42";
const AGENT_NAME = "creatorshield-demo-agent";

const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
if (!agentPrivateKey) {
  console.error("Missing AGENT_PRIVATE_KEY in .env");
  process.exit(1);
}

const signer = privateKeyToAccount(agentPrivateKey);
const headers = { "X-Agent-Name": AGENT_NAME };

console.log("1) Onbetaald verzoek...");
const unpaidRes = await fetch(URL_TO_FETCH, { headers });
console.log("   Status:", unpaidRes.status);

console.log("2) Betalen via x402...");
const client = new x402Client();
client.register(BASE_SEPOLIA, new ExactEvmScheme(signer));
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const paidRes = await fetchWithPayment(URL_TO_FETCH, { headers });
console.log("   Status:", paidRes.status);

const content = await paidRes.json();
console.log("   Content:", content);

const settleResponse = new x402HTTPClient(client).getPaymentSettleResponse(name =>
  paidRes.headers.get(name),
);
console.log("3) Betaling afgerond:");
console.log(JSON.stringify(settleResponse, null, 2));
