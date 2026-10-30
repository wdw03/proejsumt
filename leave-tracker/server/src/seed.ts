import { Db } from './db';
import { addDays, countLeaveDays } from './lib/dates';
import { LeaveStatus, LeaveType } from './types';

const EMPLOYEES: [string, string][] = [
  ['Priya Nair', 'Engineering'],
  ["Rahul D'Souza", 'Engineering'],
  ['Ananya Iyer', 'Design'],
  ['Vikram Singh', 'Sales'],
  ['Meera Krishnan', 'Engineering'],
  ['Arjun Mehta', 'Sales'],
  ['Kavya Reddy', 'Design'],
  ['Rohan Kapoor', 'Engineering'],
];

const REASONS = [
  'Family function',
  'Doctor visit',
  'Travel to hometown',
  'Fever',
  'Personal work',
  'Wedding in the family',
  'Child school event',
  null,
  null,
];

const TOTAL_LEAVES = 45;
const PENDING_COUNT = 12;
const REJECTED_COUNT = 6;

interface SeedLeave {
  employeeId: number;
  type: LeaveType;
  start: string;
  end: string;
  status: LeaveStatus;
  reason: string | null;
  fixed: boolean;
}

/** Small deterministic random generator, so every machine gets the same data. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inserts demo data when the database has no employees yet. Returns true when it inserted data. */
export function seed(db: Db, today: string): boolean {
  const existing = db.get<{ total: number }>('SELECT COUNT(*) AS total FROM employees');
  if (existing && Number(existing.total) > 0) return false;

  for (const [name, team] of EMPLOYEES) {
    db.run('INSERT INTO employees (name, team) VALUES (?, ?)', [name, team]);
  }

  const random = mulberry32(20261030);
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

  const leaves: SeedLeave[] = [
    { employeeId: 1, type: 'CASUAL', start: addDays(today, 7), end: addDays(today, 9), status: 'APPROVED', reason: 'Family function', fixed: true },
    { employeeId: 2, type: 'SICK', start: addDays(today, -20), end: addDays(today, -20), status: 'APPROVED', reason: 'Fever', fixed: true },
    { employeeId: 2, type: 'CASUAL', start: addDays(today, 12), end: addDays(today, 13), status: 'PENDING', reason: 'Personal work', fixed: true },
  ];

  const overlaps = (employeeId: number, start: string, end: string) =>
    leaves.some((l) => l.employeeId === employeeId && l.start <= addDays(end, 1) && l.end >= addDays(start, -1));

  let employeeId = 0;
  while (leaves.length < TOTAL_LEAVES) {
    employeeId = (employeeId % EMPLOYEES.length) + 1;
    const length = pick([1, 1, 2, 2, 3, 3, 4, 5]);
    for (let attempt = 0; attempt < 100; attempt++) {
      const start = addDays(today, -60 + Math.floor(random() * 88));
      const end = addDays(start, length - 1);
      if (overlaps(employeeId, start, end)) continue;
      leaves.push({ employeeId, type: pick<LeaveType>(['CASUAL', 'CASUAL', 'SICK', 'EARNED']), start, end, status: 'APPROVED', reason: pick(REASONS), fixed: false });
      break;
    }
  }

  // Latest generated requests are still pending; a few older ones were rejected.
  const generated = leaves.filter((l) => !l.fixed).sort((a, b) => (a.start < b.start ? 1 : -1));
  const pendingNeeded = PENDING_COUNT - leaves.filter((l) => l.status === 'PENDING').length;
  generated.slice(0, pendingNeeded).forEach((l) => (l.status = 'PENDING'));
  const older = generated.slice(pendingNeeded);
  for (let i = 0; i < REJECTED_COUNT; i++) older[Math.floor((i * older.length) / REJECTED_COUNT) + 1].status = 'REJECTED';

  // Requests are made a few days before they start, and never later than two days ago.
  const sorted = [...leaves].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.employeeId - b.employeeId));
  sorted.forEach((leave, index) => {
    const madeOn = leave.start < addDays(today, -2) ? addDays(leave.start, -2 - Math.floor(random() * 10)) : addDays(today, -2 - Math.floor(random() * 5));
    const time = `${String(8 + (index % 10)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00.000Z`;
    db.run(
      `INSERT INTO leaves (employee_id, type, start_date, end_date, days, status, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [leave.employeeId, leave.type, leave.start, leave.end, countLeaveDays(leave.start, leave.end), leave.status, leave.reason, `${madeOn}T${time}`],
    );
  });
  return true;
}
