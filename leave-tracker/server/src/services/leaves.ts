import { Db } from '../db';
import { countLeaveDays, isValidDate } from '../lib/dates';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import { findEmployee } from '../repos/employees';
import { countLeaves, findLeave, findOverlap, insertLeave, LeaveFilter, listLeaves, updateStatus } from '../repos/leaves';
import { isLeaveType, Leave, ListResult } from '../types';

const REASON_MAX = 200;

export async function getLeavePage(db: Db, filter: LeaveFilter & { page: number; limit: number }): Promise<ListResult> {
  const items = await listLeaves(db, filter);
  const total = await countLeaves(db, filter);
  return {
    items,
    page: filter.page,
    limit: filter.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / filter.limit)),
  };
}

export async function getLeave(db: Db, id: number): Promise<Leave> {
  const leave = await findLeave(db, id);
  if (!leave) throw new NotFoundError('Leave request not found');
  return leave;
}

export async function createLeave(db: Db, body: unknown): Promise<Leave> {
  const input = (body ?? {}) as Record<string, unknown>;

  const employeeId = Number(input.employeeId);
  if (!Number.isInteger(employeeId) || employeeId <= 0 || !(await findEmployee(db, employeeId))) {
    throw new ValidationError('Choose an employee');
  }
  const type = input.type;
  if (!isLeaveType(type)) throw new ValidationError('Choose a leave type');

  const startDate = input.startDate;
  if (typeof startDate !== 'string' || !isValidDate(startDate)) throw new ValidationError('Enter a valid start date');
  const endDate = input.endDate;
  if (typeof endDate !== 'string' || !isValidDate(endDate)) throw new ValidationError('Enter a valid end date');
  if (endDate < startDate) throw new ValidationError('End date cannot be before start date');

  const reason = typeof input.reason === 'string' && input.reason.trim() ? input.reason.trim() : null;
  if (reason && reason.length > REASON_MAX) {
    throw new ValidationError(`Reason can be at most ${REASON_MAX} characters`);
  }

  if (await findOverlap(db, employeeId, startDate, endDate)) {
    throw new ConflictError('This employee already has leave on these dates');
  }

  const id = await insertLeave(db, {
    employeeId,
    type,
    startDate,
    endDate,
    days: countLeaveDays(startDate, endDate),
    reason,
    createdAt: new Date().toISOString(),
  });
  return getLeave(db, id);
}

export async function decideLeave(db: Db, id: number, status: 'APPROVED' | 'REJECTED'): Promise<Leave> {
  const leave = await getLeave(db, id);
  if (leave.status !== 'PENDING') {
    throw new ConflictError('Only pending requests can be approved or rejected');
  }
  await updateStatus(db, id, status);
  return getLeave(db, id);
}
