require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json())


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    default: "unknown"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Report = mongoose.model("Report", reportSchema);

app.post("/reports", async (req, res) => {
  try {
    const { type, location, severity } = req.body;

    if (!type || !location) {
      return res.status(400).json({
        error: "type and location are required"
      });
    }

    const newReport = new Report({
      type,
      location,
      severity
    });

    const savedReport = await newReport.save();

    res.status(201).json({
      message: "Disaster report saved",
      report: savedReport
    });

  } catch (error) {
    res.status(500).json({
      error: "Server error"
    });
  }
});

app.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (error) {
    res.status(500).json({
      error: "Server error"
    });
  }
});
app.get("/reports/:id", async (req, res) => {
  try {
    const reportId = req.params.id;

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    res.json(report);

  } catch (error) {
    res.status(400).json({
      error: "Invalid report ID"
    });
  }
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
