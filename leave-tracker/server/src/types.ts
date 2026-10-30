export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export interface Employee {
  id: number;
  name: string;
  team: string;
}

export interface Leave {
  id: number;
  employeeId: number;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  createdAt: string;
}

export interface ListResult {
  items: Leave[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function isLeaveStatus(value: unknown): value is LeaveStatus {
  return typeof value === 'string' && (LEAVE_STATUSES as readonly string[]).includes(value);
}

export function isLeaveType(value: unknown): value is LeaveType {
  return typeof value === 'string' && (LEAVE_TYPES as readonly string[]).includes(value);
}
