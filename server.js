const path = require("path");
const express = require("express");
const { clerkMiddleware } = require("@clerk/express");
const db = require("./db");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

// Clerk middleware (makes auth available on all requests)
app.use(clerkMiddleware());

// Parse JSON bodies for API routes
app.use("/api", express.json());

// API routes
app.use("/api", apiRoutes);

// Serve the built React app
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// SPA fallback — serve index.html for any non-API route
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("App not built yet. Run: cd client && npm run build");
    }
  });
});

// Start server after DB is ready
db.initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server running on port " + PORT);
      console.log("Serving static files from:", distPath);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
