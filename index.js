const express = require("express");
const app = express();
app.use(express.json());
app.post("/reports", (req, res) => {
  const report = req.body;

  res.status(201).json({
    message: "Disaster report received",
    report: report
  });
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/time", (req, res) => {
  res.json({ time: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
