import fs from 'fs';
import path from 'path';
import { Db } from './db';

/** Applies every .sql file in `dir` that has not been applied yet, in name order. Returns the new ones. */
export function migrate(db: Db, dir: string): string[] {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const done = new Set(db.all<{ name: string }>('SELECT name FROM schema_migrations').map((r) => r.name));

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    db.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
    db.run('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)', [file, new Date().toISOString()]);
    applied.push(file);
  }
  return applied;
}
