import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { createLeave } from '../api';
import { TYPE_OPTIONS } from '../constants';
import { describeError } from '../format';
import { Employee, Leave, LeaveType } from '../types';

interface Props {
  open: boolean;
  employees: Employee[];
  onClose: () => void;
  onCreated: (leave: Leave) => void;
}

interface FormState {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

const EMPTY_FORM: FormState = { employeeId: '', type: 'CASUAL', startDate: '', endDate: '', reason: '' };

export function NewLeaveDialog({ open, employees, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const update = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const leave = await createLeave({
        employeeId: Number(form.employeeId),
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      onCreated(leave);
    } catch (err) {
      setError(describeError(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dialog-backdrop">
      <form className="dialog" role="dialog" aria-modal="true" aria-label="New leave" onSubmit={handleSubmit}>
        <h2>New leave</h2>
        {error && (
          <p className="dialog-error" data-testid="dialog-error" role="alert">
            {error}
          </p>
        )}
        <label className="field">
          <span>Employee</span>
          <select value={form.employeeId} onChange={update('employeeId')}>
            <option value="">Choose…</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Type</span>
          <select value={form.type} onChange={update('type')}>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field-row">
          <label className="field">
            <span>From</span>
            <input type="date" value={form.startDate} onChange={update('startDate')} />
          </label>
          <label className="field">
            <span>To</span>
            <input type="date" value={form.endDate} onChange={update('endDate')} />
          </label>
        </div>
        <label className="field">
          <span>Reason</span>
          <input type="text" value={form.reason} onChange={update('reason')} placeholder="Optional" />
        </label>
        <div className="dialog-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
