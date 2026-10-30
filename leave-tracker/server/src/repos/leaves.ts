import { Db, SqlValue } from '../db';
import { Leave, LeaveStatus, LeaveType } from '../types';

interface LeaveRow {
  id: number;
  employee_id: number;
  employee_name: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  created_at: string;
}

const SELECT_LEAVE = `
  SELECT l.id, l.employee_id, e.name AS employee_name, l.type, l.start_date, l.end_date,
         l.days, l.status, l.reason, l.created_at
  FROM leaves l
  JOIN employees e ON e.id = l.employee_id`;

function toLeave(row: LeaveRow): Leave {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    days: row.days,
    status: row.status,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export interface LeaveFilter {
  q?: string;
  status?: LeaveStatus;
}

export async function listLeaves(db: Db, filter: LeaveFilter & { page: number; limit: number }): Promise<Leave[]> {
  const conditions: string[] = [];
  const params: SqlValue[] = [];
  if (filter.q) {
    conditions.push(`e.name LIKE '%${filter.q}%'`);
  }
  if (filter.status !== undefined) {
    conditions.push('l.status = ?');
    params.push(filter.status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (filter.page - 1) * filter.limit;

  const rows = db.all<LeaveRow>(
    `${SELECT_LEAVE} ${where} ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`,
    [...params, filter.limit, offset],
  );
  return rows.map(toLeave);
}

export async function countLeaves(db: Db, filter: LeaveFilter): Promise<number> {
  const conditions: string[] = [];
  const params: SqlValue[] = [];
  if (filter.q) {
    conditions.push('e.name LIKE ?');
    params.push(`%${filter.q}%`);
  }
  if (filter.status !== undefined) {
    conditions.push('l.status = ?');
    params.push(filter.status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const row = db.get<{ total: number }>(
    `SELECT COUNT(*) AS total FROM leaves l JOIN employees e ON e.id = l.employee_id ${where}`,
    params,
  );
  return row ? Number(row.total) : 0;
}

export async function countByStatus(db: Db): Promise<Record<LeaveStatus, number>> {
  const counts: Record<LeaveStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  const rows = db.all<{ status: LeaveStatus; total: number }>('SELECT status, COUNT(*) AS total FROM leaves GROUP BY status');
  for (const row of rows) counts[row.status] = Number(row.total);
  return counts;
}

export async function findLeave(db: Db, id: number): Promise<Leave | undefined> {
  const row = db.get<LeaveRow>(`${SELECT_LEAVE} WHERE l.id = ?`, [id]);
  return row ? toLeave(row) : undefined;
}

/** An existing pending or approved leave of the same employee that shares at least one day. */
export async function findOverlap(db: Db, employeeId: number, startDate: string, endDate: string): Promise<Leave | undefined> {
  const row = db.get<LeaveRow>(
    `${SELECT_LEAVE}
     WHERE l.employee_id = ? AND l.status IN ('PENDING', 'APPROVED')
       AND l.start_date >= ? AND l.end_date <= ?`,
    [employeeId, startDate, endDate],
  );
  return row ? toLeave(row) : undefined;
}

export interface NewLeave {
  employeeId: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  createdAt: string;
}

export async function insertLeave(db: Db, leave: NewLeave): Promise<number> {
  const result = db.run(
    `INSERT INTO leaves (employee_id, type, start_date, end_date, days, status, reason, created_at)
     VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    [leave.employeeId, leave.type, leave.startDate, leave.endDate, leave.days, leave.reason, leave.createdAt],
  );
  return result.lastId;
}

export async function updateStatus(db: Db, id: number, status: LeaveStatus): Promise<void> {
  db.run('UPDATE leaves SET status = ? WHERE id = ?', [status, id]);
}
