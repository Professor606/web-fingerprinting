const express = require("express");
const fetch = require("node-fetch");
const Visit = require("../models/Visit");
const { create4DigitId } = require("../utils/helpers");

const router = express.Router();

// ─── IP Info API ──────────────────────────────────────────────────────────────

router.get("/ipinfo", async (req, res) => {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token) {
      return res
        .status(500)
        .json({ error: "IP info service is not configured" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://ipinfo.io/json?token=${token}`, {
      signal: controller.signal,
      headers: { "User-Agent": "FingerprintApp/1.0", Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "Failed to fetch IP information",
        details: errorText,
      });
    }

    const data = await response.json();
    if (!data.ip) {
      return res
        .status(502)
        .json({ error: "Invalid response from IP info service" });
    }
    res.json(data);
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Request timeout" });
    }
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return res.status(503).json({ error: "Cannot reach IPInfo API" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Fingerprint Data Ingestion ───────────────────────────────────────────────

router.post("/data", async (req, res) => {
  try {
    const body = req.body;

    if (!body || !body.fingerprints) {
      return res.status(400).json({ error: "Missing fingerprints object" });
    }

    const hashKeys = [
      "userAgentFingerprint", "platformFingerprint", "doNotTrackFingerprint",
      "javaEnabledFingerprint", "hardwareConcurrencyFingerprint", "deviceMemoryFingerprint",
      "screenFingerprint", "languageFingerprint", "languagesFingerprint",
      "windowFingerprint", "timezoneFingerprint", "ipFingerprint",
      "canvasFingerprint", "webglFingerprint", "audioFingerprint",
      "fontsFingerprint", "webrtcFingerprint"
    ];

    const allHashesString = hashKeys.map(k => body.fingerprints[k] || "").join("");
    const userID = create4DigitId(allHashesString);

    const networkID = create4DigitId(
      (body.fingerprints.ipFingerprint || "") +
      (body.fingerprints.timezoneFingerprint || "")
    );

    const visit = await Visit.create({
      timestamp: body.timestamp || new Date(),
      userID,
      networkID,
      fingerprints: body.fingerprints,
      info: body.info || {},
    });

    res
      .status(200)
      .json({ status: "Success", message: "Visit logged.", id: visit._id });
  } catch (error) {
    console.error("Error saving visit:", error.message);
    res.status(500).json({ error: "Failed to save visit" });
  }
});

module.exports = router;
