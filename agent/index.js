const URL = "http://localhost:4021/premium/artikel-42";

const res = await fetch(URL);
console.log("Status:", res.status);

if (res.status === 402) {
  const header = res.headers.get("payment-required");
  const instructions = JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  console.log("Betaalinstructies:");
  console.log(JSON.stringify(instructions, null, 2));
} else {
  console.log(await res.json());
}
