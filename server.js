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

// Serve the static HTML file
app.use(express.static("."));

// Start server after DB is ready
db.initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server running on port " + PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
