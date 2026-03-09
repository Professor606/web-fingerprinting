const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const Visit = require("../models/Visit");
const adminAuth = require("../middleware/auth");

const router = express.Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "changeme";
const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

// ─── Admin Dashboard Auth & Views ──────────────────────────────────────────────

router.post("/api/admin/login", (req, res) => {
  const { key } = req.body;
  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid admin key" });
  }

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  // Set httpOnly cookie so the server can validate on page load
  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
  });

  res.json({ token });
});

// Admin logout — clear cookie and redirect
router.get("/api/admin/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.redirect("/admin");
});

// Serve the admin dashboard HTML securely
router.get("/admin", (req, res) => {
  const cookieToken = req.cookies && req.cookies.admin_token;
  if (cookieToken) {
    try {
      jwt.verify(cookieToken, JWT_SECRET);
      // Valid token → serve the full dashboard
      return res.sendFile(path.join(__dirname, "../admin", "index.html"));
    } catch (err) {
      // Invalid/expired token → clear it and show login
      res.clearCookie("admin_token");
    }
  }
  // No valid token → serve login-only page
  res.sendFile(path.join(__dirname, "../admin", "login.html"));
});

// ─── Admin API Routes ─────────────────────────────────────────────────────────

// Stats overview
router.get("/api/admin/stats", adminAuth, async (req, res) => {
  try {
    const [totalVisits, uniqueUsers, uniqueIPs, topCountries, browserStats, recentVisits] =
      await Promise.all([
        Visit.countDocuments(),
        Visit.distinct("userID").then((ids) => ids.length),
        Visit.distinct("info.ip").then((ips) => ips.length),
        Visit.aggregate([
          { $match: { "info.ipLocation.country": { $exists: true, $ne: "Unknown" } } },
          { $group: { _id: "$info.ipLocation.country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Visit.aggregate([
          { $match: { "info.userAgent": { $exists: true } } },
          {
            $project: {
              browser: {
                $switch: {
                  branches: [
                    { case: { $regexMatch: { input: "$info.userAgent", regex: /Edg\// } }, then: "Edge" },
                    { case: { $regexMatch: { input: "$info.userAgent", regex: /Firefox\// } }, then: "Firefox" },
                    { case: { $regexMatch: { input: "$info.userAgent", regex: /Chrome\// } }, then: "Chrome" },
                    { case: { $regexMatch: { input: "$info.userAgent", regex: /Safari\// } }, then: "Safari" },
                  ],
                  default: "Other",
                },
              },
            },
          },
          { $group: { _id: "$browser", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Visit.find().sort({ timestamp: -1 }).limit(5).lean(),
      ]);

    res.json({
      totalVisits,
      uniqueUsers,
      uniqueIPs,
      topCountries,
      browserStats,
      recentVisits,
    });
  } catch (error) {
    console.error("Stats error:", error.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// All visits (paginated)
router.get("/api/admin/visits", adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const rawSearch = req.query.search;
    const search = typeof rawSearch === 'string' ? rawSearch.trim() : "";
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      // Escape search input to prevent regex injection attacks
      const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const orConditions = [
        { "info.ip": { $regex: safeSearch, $options: "i" } },
        { "info.ipLocation.country": { $regex: safeSearch, $options: "i" } },
        { "info.ipLocation.city": { $regex: safeSearch, $options: "i" } },
        { "info.userAgent": { $regex: safeSearch, $options: "i" } },
      ];

      // Support secure partial matches on strictly numerical values
      if (/^\d+$/.test(search)) {
        orConditions.push({ $expr: { $regexMatch: { input: { $toString: { $ifNull: ["$userID", ""] } }, regex: safeSearch } } });
        orConditions.push({ $expr: { $regexMatch: { input: { $toString: { $ifNull: ["$networkID", ""] } }, regex: safeSearch } } });
      }

      filter = { $or: orConditions };
    }

    const [visits, total] = await Promise.all([
      Visit.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      Visit.countDocuments(filter),
    ]);

    res.json({
      visits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Visits error:", error.message);
    res.status(500).json({ error: "Failed to fetch visits" });
  }
});

// Single user history
router.get("/api/admin/user/:userID", adminAuth, async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);
    const visits = await Visit.find({ userID }).sort({ timestamp: -1 }).lean();
    res.json({ userID, totalVisits: visits.length, visits });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user visits" });
  }
});

// Cross-session matching for a specific visit
router.get("/api/admin/match/:visitId", adminAuth, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.visitId).lean();
    if (!visit) return res.status(404).json({ error: "Visit not found" });

    const hashKeys = [
      "userAgentFingerprint", "platformFingerprint", "doNotTrackFingerprint",
      "javaEnabledFingerprint", "hardwareConcurrencyFingerprint", "deviceMemoryFingerprint",
      "screenFingerprint", "languageFingerprint", "languagesFingerprint",
      "windowFingerprint", "timezoneFingerprint", "ipFingerprint",
      "canvasFingerprint", "webglFingerprint", "audioFingerprint",
      "fontsFingerprint", "webrtcFingerprint"
    ];
    const totalHashes = 17;

    // Get all unique users (one visit per user)
    const allUsers = await Visit.aggregate([
      { $match: { userID: { $ne: visit.userID } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$userID",
          latestVisit: { $first: "$$ROOT" },
        },
      },
    ]);

    const matches = allUsers
      .map((u) => {
        const other = u.latestVisit;
        let matched = 0;
        const details = {};

        for (const key of hashKeys) {
          const same =
            visit.fingerprints[key] &&
            other.fingerprints[key] &&
            visit.fingerprints[key] === other.fingerprints[key];
          details[key] = same;
          if (same) matched++;
        }

        return {
          userID: other.userID,
          networkID: other.networkID,
          ip: other.info?.ip,
          country: other.info?.ipLocation?.country,
          matchedHashes: matched,
          totalHashes,
          confidence: Math.round((matched / totalHashes) * 100),
          details,
          lastSeen: other.timestamp,
        };
      })
      .filter((m) => m.matchedHashes > 0)
      .sort((a, b) => b.confidence - a.confidence);

    res.json({
      sourceVisit: {
        id: visit._id,
        userID: visit.userID,
        timestamp: visit.timestamp,
      },
      matches,
    });
  } catch (error) {
    console.error("Match error:", error.message);
    res.status(500).json({ error: "Failed to compute matches" });
  }
});

// Visit locations for map
router.get("/api/admin/locations", adminAuth, async (req, res) => {
  try {
    const locations = await Visit.aggregate([
      { $match: { "info.ipLocation.loc": { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$info.ipLocation.loc",
          city: { $first: "$info.ipLocation.city" },
          country: { $first: "$info.ipLocation.country" },
          count: { $sum: 1 },
          lastSeen: { $max: "$timestamp" },
        },
      },
    ]);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// Visits over time (for chart)
router.get("/api/admin/timeline", adminAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const timeline = await Visit.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userID" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          visits: "$count",
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
      { $sort: { date: 1 } },
    ]);
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

module.exports = router;
