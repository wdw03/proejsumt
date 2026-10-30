import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

export type SqlValue = string | number | null;

export interface Db {
  all<T>(sql: string, params?: SqlValue[]): T[];
  get<T>(sql: string, params?: SqlValue[]): T | undefined;
  run(sql: string, params?: SqlValue[]): { changes: number; lastId: number };
  exec(sql: string): void;
}

/**
 * SQLite through sql.js (SQLite compiled to WebAssembly, so nothing is compiled on install).
 * sql.js keeps the database in memory: every write is saved to `file`, and the file is
 * loaded again when another process (for example `npm run db:setup`) has changed it.
 * Pass `null` for a database that lives only in memory (used by the tests).
 */
export async function openDb(file: string | null): Promise<Db> {
  const SQL = await initSqlJs();
  let db: Database;
  let loadedAt = 0;

  const load = () => {
    if (file && fs.existsSync(file)) {
      db = new SQL.Database(fs.readFileSync(file));
      loadedAt = fs.statSync(file).mtimeMs;
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');
  };

  const reloadIfChanged = () => {
    if (file && fs.existsSync(file) && fs.statSync(file).mtimeMs !== loadedAt) load();
  };

  const save = () => {
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(db.export()));
    loadedAt = fs.statSync(file).mtimeMs;
    db.run('PRAGMA foreign_keys = ON');
  };

  const all = <T>(sql: string, params: SqlValue[] = []): T[] => {
    reloadIfChanged();
    const stmt = db.prepare(sql);
    try {
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as unknown as T);
      return rows;
    } finally {
      stmt.free();
    }
  };

  load();

  return {
    all,
    get: <T>(sql: string, params: SqlValue[] = []) => all<T>(sql, params)[0],
    run(sql, params = []) {
      reloadIfChanged();
      db.run(sql, params);
      const changes = db.getRowsModified();
      const lastId = Number(db.exec('SELECT last_insert_rowid()')[0].values[0][0]);
      save();
      return { changes, lastId };
    },
    exec(sql) {
      reloadIfChanged();
      db.exec(sql);
      save();
    },
  };
}
