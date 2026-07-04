import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { writeFileSync, existsSync } from "node:fs";

const envPath = new URL("../.env", import.meta.url);

if (existsSync(envPath)) {
  console.error(".env already exists — refusing to overwrite. Delete it first if you want fresh wallets.");
  process.exit(1);
}

const publisherKey = generatePrivateKey();
const agentKey = generatePrivateKey();
const publisher = privateKeyToAccount(publisherKey);
const agent = privateKeyToAccount(agentKey);

const envContent = `# Base Sepolia testnet wallets — generated for CreatorShield hackathon demo. Never commit this file.
NETWORK=base-sepolia
FACILITATOR_URL=https://x402.org/facilitator

PUBLISHER_ADDRESS=${publisher.address}
PUBLISHER_PRIVATE_KEY=${publisherKey}

AGENT_ADDRESS=${agent.address}
AGENT_PRIVATE_KEY=${agentKey}
`;

writeFileSync(envPath, envContent);

console.log("Publisher address:", publisher.address);
console.log("Agent address:    ", agent.address);
console.log("\nWritten to .env (not committed).");
