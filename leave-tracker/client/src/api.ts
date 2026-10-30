import { Employee, Leave, ListResult, NewLeave, StatusFilter, Summary } from './types';

// Empty in development: requests go to the Vite dev server, which forwards /api to the API.
const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    const body = await res.json();
    throw new ApiError(body?.error?.message ?? res.statusText, res.status);
  }
  return res.json() as Promise<T>;
}

export function listLeaves(params: { q: string; status: StatusFilter; page: number }, signal?: AbortSignal) {
  const query = new URLSearchParams({ q: params.q, status: params.status, page: String(params.page) });
  return request<ListResult>(`/api/leaves?${query}`, { signal });
}

export function getSummary() {
  return request<Summary>('/api/leaves/summary');
}

export function listEmployees() {
  return request<Employee[]>('/api/employees');
}

export function createLeave(leave: NewLeave) {
  return request<Leave>('/api/leaves', { method: 'POST', body: JSON.stringify(leave) });
}

export function approveLeave(id: number) {
  return request<Leave>(`/api/leaves/${id}/approve`, { method: 'POST' });
}

export function rejectLeave(id: number) {
  return request<Leave>(`/api/leaves/${id}/reject`, { method: 'POST' });
}
