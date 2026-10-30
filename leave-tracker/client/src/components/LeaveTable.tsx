import { memo } from 'react';
import { STATUS_LABELS, TYPE_LABELS } from '../constants';
import { formatDate } from '../format';
import { Leave } from '../types';

interface Props {
  leaves: Leave[];
  loading: boolean;
  onDecision: (id: number, decision: 'approve' | 'reject') => void;
}

function LeaveTableView({ leaves, loading, onDecision }: Props) {
  const totalDays = leaves.reduce((sum, leave) => sum + leave.days, 0);

  return (
    <div className="table-wrap">
      <table className="leave-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>From</th>
            <th>To</th>
            <th className="num">Days</th>
            <th>Status</th>
            <th>Reason</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 && (
            <tr>
              <td colSpan={8} className="empty">
                {loading ? 'Loading…' : 'No leave requests match these filters.'}
              </td>
            </tr>
          )}
          {leaves.map((leave) => (
            <tr key={leave.id} data-testid="leave-row" data-id={leave.id}>
              <td data-testid="row-employee">{leave.employeeName}</td>
              <td>{TYPE_LABELS[leave.type]}</td>
              <td data-testid="row-from">{formatDate(leave.startDate)}</td>
              <td data-testid="row-to">{formatDate(leave.endDate)}</td>
              <td className="num" data-testid="row-days">
                {leave.days}
              </td>
              <td>
                <span className={`badge badge--${leave.status.toLowerCase()}`} data-testid="row-status">
                  {STATUS_LABELS[leave.status]}
                </span>
              </td>
              <td className="reason">{leave.reason ?? ''}</td>
              <td className="actions">
                {leave.status === 'PENDING' && (
                  <>
                    <button type="button" className="button button--small" onClick={() => onDecision(leave.id, 'approve')}>
                      Approve
                    </button>
                    <button type="button" className="button button--small button--danger" onClick={() => onDecision(leave.id, 'reject')}>
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="total-label">
              Total days on this page
            </td>
            <td className="num" data-testid="total-days">
              {totalDays}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export const LeaveTable = memo(LeaveTableView);
