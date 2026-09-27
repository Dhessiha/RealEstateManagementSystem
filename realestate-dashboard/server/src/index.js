import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import collectionsRoutes from "./routes/collections.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionsRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const isDbErr = /ECONNREFUSED|ER_ACCESS_DENIED_ERROR|ER_BAD_DB_ERROR|PROTOCOL_CONNECTION_LOST|ETIMEDOUT|ENOTFOUND/i.test(err.code || err.message || "");
  res.status(500).json({
    error: isDbErr
      ? `Could not reach MySQL database (${err.code || err.message}). Check MySQL host, user, password, and port in server/.env and make sure MySQL service is running.`
      : "Server error",
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SiteFlow API listening on http://localhost:${PORT}`);
});
