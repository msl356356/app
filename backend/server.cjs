const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 4000;
const HISTORY_FILE = "./history.json";
const ADMIN_PASSWORD = "akash8454"; // Change this to your own password!
const COOLDOWN_TIME = 5 * 60; // 5 minutes in seconds
const SEGMENTS = 10;

app.use(cors());
app.use(express.json());

// Friendly root route
app.get("/", (req, res) => {
  res.send(
    "<h2>🎡 Battle Wheel Spin Backend</h2><p>API is running!<br>GET <code>/history</code> to view spin history.<br>POST <code>/history</code> to add a spin.<br>Admin: POST <code>/admin/clear</code>, GET <code>/admin/download</code>, POST <code>/admin/delete</code></p>"
  );
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
  history.unshift(newSpin); // add to start
  // Keep only last 100 spins
  history = history.slice(0, 100);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  res.json({ success: true, history }); // Send back updated history
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
  // Use a more reliable random number generation
  const number = Math.floor(Math.random() * SEGMENTS);

  // Log the number for debugging
  console.log(`Generated spin number: ${number}`);

  // Add a small delay to ensure consistent timing
  setTimeout(() => {
    res.json({ number });
  }, 100);
});

// Get next spin time
app.get("/next-spin-time", (req, res) => {
  // Get the last spin time from history
  let lastSpinTime = null;
  if (fs.existsSync(HISTORY_FILE)) {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    if (history.length > 0) {
      const lastSpin = history[0];
      lastSpinTime = new Date(`${lastSpin.date} ${lastSpin.time}`);
    }
  }

  // Calculate next spin time based on 5-minute intervals
  const now = new Date();
  const currentMinute = now.getUTCMinutes();
  const currentSecond = now.getUTCSeconds();

  // Calculate minutes until next 5-minute mark
  const minutesUntilNext = 5 - (currentMinute % 5);
  const secondsUntilNext = minutesUntilNext * 60 - currentSecond;

  // Create next spin time
  const nextSpinTime = new Date(now.getTime() + secondsUntilNext * 1000);

  // If we have a last spin time and it's more recent than our calculated time,
  // use last spin time + COOLDOWN_TIME
  if (lastSpinTime && nextSpinTime - lastSpinTime < COOLDOWN_TIME * 1000) {
    nextSpinTime.setTime(lastSpinTime.getTime() + COOLDOWN_TIME * 1000);
  }

  res.json({ nextSpinTime: nextSpinTime.toISOString() });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
