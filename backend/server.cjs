require("dotenv").config(); // This must be the very first line
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path"); // Required for creating file paths

const app = express();

// --- For Production: Use environment variables ---
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "akash8454";

// --- For Production: Persistent storage path ---
// This saves your history file to a permanent disk on services like Render
const DATA_DIR = "/data";
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

// Create the data directory on server start if it doesn't exist
{
  /*if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}*/
}

// --- Other constants ---
const COOLDOWN_TIME = 5 * 60; // 5 minutes in seconds
const SEGMENTS = 10;

// --- For Production: Secure CORS policy ---
// This allows requests ONLY from the URL you set in your environment variables
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

// --- ROUTES ---

// Friendly root route
app.get("/", (req, res) => {
  res.send("<h2>🎡 Battle Wheel Spin Backend</h2><p>API is running!</p>");
});

// ADMIN: Secure login endpoint
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required." });
  }
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: "Login successful." });
  } else {
    res.status(401).json({ error: "Invalid password." });
  }
});

// Load history
app.get("/history", (req, res) => {
  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, "utf-8");
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

// Add a new spin
app.post("/history", (req, res) => {
  const newSpin = req.body;
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  }
  history.unshift(newSpin);
  history = history.slice(0, 100);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  res.json({ success: true, history });
});

// ADMIN: Clear all history
app.post("/admin/clear", (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Unauthorized" });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  res.json({ success: true, message: "History cleared." });
});

// ADMIN: Download history as JSON
app.get("/admin/download", (req, res) => {
  if (fs.existsSync(HISTORY_FILE)) {
    res.download(HISTORY_FILE, "history.json");
  } else {
    res.status(404).send("No history found.");
  }
});

// ADMIN: Delete a specific entry by index
app.post("/admin/delete", (req, res) => {
  const { password, index } = req.body;
  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Unauthorized" });
  if (!fs.existsSync(HISTORY_FILE))
    return res.status(404).json({ error: "No history found." });
  let history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  if (index < 0 || index >= history.length)
    return res.status(400).json({ error: "Invalid index." });
  history.splice(index, 1);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  res.json({ success: true, message: "Entry deleted." });
});

// Get next spin number
app.get("/next-spin-number", (req, res) => {
  const number = Math.floor(Math.random() * SEGMENTS);
  console.log(`Generated spin number: ${number}`);
  setTimeout(() => {
    res.json({ number });
  }, 100);
});

// Get next spin time
app.get("/next-spin-time", (req, res) => {
  let lastSpinTime = null;
  if (fs.existsSync(HISTORY_FILE)) {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    if (history.length > 0) {
      const lastSpin = history[0];
      lastSpinTime = new Date(`${lastSpin.date} ${lastSpin.time}`);
    }
  }

  const now = new Date();
  const currentMinute = now.getUTCMinutes();
  const currentSecond = now.getUTCSeconds();
  const minutesUntilNext = 5 - (currentMinute % 5);
  const secondsUntilNext = minutesUntilNext * 60 - currentSecond;
  const nextSpinTime = new Date(now.getTime() + secondsUntilNext * 1000);

  if (lastSpinTime && nextSpinTime - lastSpinTime < COOLDOWN_TIME * 1000) {
    nextSpinTime.setTime(lastSpinTime.getTime() + COOLDOWN_TIME * 1000);
  }

  res.json({ nextSpinTime: nextSpinTime.toISOString() });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
