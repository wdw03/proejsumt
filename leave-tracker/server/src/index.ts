import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { Config, loadConfig } from './config';
import { openDb } from './db';

async function main() {
  let config: Config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  if (!fs.existsSync(config.dbFile)) {
    const shown = path.relative(path.join(__dirname, '..'), config.dbFile).split(path.sep).join('/');
    console.warn(`Database not found at ${shown}. Run the database setup first.`);
  }

  const db = await openDb(config.dbFile);
  const app = createApp(db, { corsOrigin: config.corsOrigin });

  const server = app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} is already in use. Stop the other program or change PORT in .env.`);
      process.exit(1);
    }
    throw err;
  });
}

main();
