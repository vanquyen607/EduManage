import "express-async-errors";
import express from "express";
import cors from "cors";
import routes from "./routes.js";
import { initDb } from "./db.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(routes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export { initDb };
export default app;
