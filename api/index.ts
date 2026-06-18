import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { initDb } from '../src/server/db.js';
import routes from '../src/server/routes.js';

initDb();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(routes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export const handler = serverless(app);
