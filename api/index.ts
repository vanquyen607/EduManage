import app, { initDb } from '../src/server/app.js';

let ready: Promise<void> | null = null;
async function ensureDb() {
  if (!ready) ready = initDb();
  await ready;
}

export default async function handler(req: any, res: any) {
  await ensureDb();
  app(req, res);
}
