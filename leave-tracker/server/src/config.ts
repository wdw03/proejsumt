import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export interface Config {
  port: number;
  dbFile: string;
  corsOrigin?: string;
}

const SERVER_ROOT = path.join(__dirname, '..');

/** Reads settings from server/.env. Values in .env are the source of truth. */
export function loadConfig(envFile = path.join(SERVER_ROOT, '.env')): Config {
  if (!fs.existsSync(envFile)) {
    throw new Error('Missing .env file. Copy .env.example to .env.');
  }
  const vars = dotenv.parse(fs.readFileSync(envFile));

  const port = Number(vars.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT in .env must be a number, got "${vars.PORT ?? ''}"`);
  }

  return {
    port,
    dbFile: path.resolve(SERVER_ROOT, vars.DB_FILE || 'data/leave-tracker.db'),
    corsOrigin: vars.CORS_ORIGIN || undefined,
  };
}
