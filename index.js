require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());


   //DATABASE CONNECTION

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

   //SCHEMAS & MODELS

// Report Schema
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

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,
  role: {
    type: String,
    default: "USER"
  }
});

const User = mongoose.model("User", userSchema);

   //AUTH MIDDLEWARE

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

   //AUTH ROUTES

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

   //REPORT ROUTES (PROTECTED)

// CREATE
app.post("/reports", authMiddleware, async (req, res) => {
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

  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// READ ALL
app.get("/reports", authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// READ ONE
app.get("/reports/:id", authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch {
    res.status(400).json({ error: "Invalid report ID" });
  }
});

// UPDATE
app.put("/reports/:id", authMiddleware, async (req, res) => {
  try {
    const { type, location, severity } = req.body;

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { type, location, severity },
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({
      message: "Report updated",
      report: updatedReport
    });
  } catch {
    res.status(400).json({ error: "Invalid request" });
  }
});

// DELETE
app.delete("/reports/:id", authMiddleware, async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);

    if (!deletedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted" });
  } catch {
    res.status(400).json({ error: "Invalid report ID" });
  }
});

   //UTILITY ROUTES

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/time", (req, res) => {
  res.json({ time: new Date() });
});

   //SERVER START

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
