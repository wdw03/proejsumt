export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED';

/** '' means "All". */
export type StatusFilter = LeaveStatus | '';

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

export type Summary = Record<LeaveStatus, number>;

export interface NewLeave {
  employeeId: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}
