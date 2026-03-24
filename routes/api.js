const express = require("express");
const { requireAuth } = require("@clerk/express");
const db = require("../db");

const router = express.Router();

// All routes require Clerk authentication
router.use(requireAuth());

// ===== User Profile =====

// Get or create profile (called on sign-in)
router.post("/profile/init", async (req, res) => {
  try {
    const { email } = req.body;
    const profile = await db.getOrCreateProfile(req.auth.userId, email || "");
    res.json(profile);
  } catch (err) {
    console.error("POST /profile/init error:", err);
    res.status(500).json({ error: "Failed to init profile" });
  }
});

// Get profile
router.get("/profile", async (req, res) => {
  try {
    const profile = await db.getProfile(req.auth.userId);
    res.json(profile || {});
  } catch (err) {
    console.error("GET /profile error:", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// Update profile
router.put("/profile", async (req, res) => {
  try {
    const profile = await db.updateProfile(req.auth.userId, req.body);
    res.json(profile || {});
  } catch (err) {
    console.error("PUT /profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ===== Day Data =====

// List all saved dates for this user
router.get("/days", async (req, res) => {
  try {
    const dates = await db.listDates(req.auth.userId);
    res.json(dates);
  } catch (err) {
    console.error("GET /days error:", err);
    res.status(500).json({ error: "Failed to load dates" });
  }
});

// Get a single day's data
router.get("/days/:date", async (req, res) => {
  try {
    const data = await db.getDayData(req.auth.userId, req.params.date);
    res.json({ data });
  } catch (err) {
    console.error("GET /days/:date error:", err);
    res.status(500).json({ error: "Failed to load day" });
  }
});

// Save a single day's data
router.put("/days/:date", async (req, res) => {
  try {
    await db.saveDayData(req.auth.userId, req.params.date, req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /days/:date error:", err);
    res.status(500).json({ error: "Failed to save day" });
  }
});

// ===== Generic Store =====

// Get a store value (routines, learning, achievements, etc.)
router.get("/store/:key", async (req, res) => {
  if (!db.isValidStoreKey(req.params.key)) {
    return res.status(400).json({ error: "Invalid store key" });
  }
  try {
    const data = await db.getStore(req.auth.userId, req.params.key);
    res.json({ data });
  } catch (err) {
    console.error("GET /store/:key error:", err);
    res.status(500).json({ error: "Failed to load store" });
  }
});

// Save a store value
router.put("/store/:key", async (req, res) => {
  if (!db.isValidStoreKey(req.params.key)) {
    return res.status(400).json({ error: "Invalid store key" });
  }
  try {
    await db.saveStore(req.auth.userId, req.params.key, req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /store/:key error:", err);
    res.status(500).json({ error: "Failed to save store" });
  }
});

module.exports = router;
