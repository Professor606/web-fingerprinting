const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./db");
const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "app")));

// Serve only the admin assets; the HTML pages go through the auth-checked
// route in routes/admin.js (login.html / index.html must not be served statically)
app.get("/admin/admin.css", (req, res) =>
  res.sendFile(path.join(__dirname, "admin", "admin.css")));
app.get("/admin/admin.js", (req, res) =>
  res.sendFile(path.join(__dirname, "admin", "admin.js")));
// Reusable admin UI components (JS + CSS only, no HTML pages)
app.use(
  "/admin/components",
  express.static(path.join(__dirname, "admin", "components"), { index: false, redirect: false })
);

// Mount Routers
app.use("/api", apiRoutes);
app.use("/", adminRoutes); // Mounts /admin, /api/admin/*

// ─── Root & Fallback ──────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "index.html"));
});

app.use((req, res) => {
  res.redirect(301, "/");
});

app.use((err, req, res, next) => {
  console.error("Express Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📊 Admin dashboard at http://localhost:${PORT}/admin`);
  console.log(process.env.IPINFO_TOKEN ? "" : "❌ IPINFO_TOKEN is Missing");
});
