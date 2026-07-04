import express from "express";

const app = express();
const PORT = 4021;

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
