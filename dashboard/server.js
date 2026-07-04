import express from "express";

const PORT = process.env.PORT || 4022;

const app = express();
app.use(express.static(new URL(".", import.meta.url).pathname));

app.listen(PORT, () => {
  console.log(`Dashboard draait op http://localhost:${PORT}`);
});
