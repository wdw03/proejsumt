import fs from 'fs';
import path from 'path';
import { loadConfig } from '../src/config';
import { openDb } from '../src/db';
import { todayLocal } from '../src/lib/dates';
import { migrate } from '../src/migrate';
import { seed } from '../src/seed';

// Usage: npm run db:setup  (apply new migrations, add demo data if the database is empty)
//        npm run db:reset  (delete the database file, then setup)
async function main() {
  const command = process.argv[2];
  if (command !== 'setup' && command !== 'reset') {
    console.error('Usage: db.ts setup | reset');
    process.exit(1);
  }

  const config = loadConfig();
  if (command === 'reset' && fs.existsSync(config.dbFile)) {
    fs.rmSync(config.dbFile);
    console.log('Deleted the database file');
  }

  const db = await openDb(config.dbFile);
  const applied = migrate(db, path.join(__dirname, '..', 'migrations'));
  console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'No new migrations');

  const seeded = seed(db, todayLocal());
  console.log(seeded ? 'Added demo data: 8 employees, 45 leave requests' : 'Demo data already present');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
