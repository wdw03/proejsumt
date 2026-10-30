import { useCallback, useEffect, useState } from 'react';
import { approveLeave, getSummary, listEmployees, listLeaves, rejectLeave } from '../api';
import { Filters } from '../components/Filters';
import { LeaveTable } from '../components/LeaveTable';
import { NewLeaveDialog } from '../components/NewLeaveDialog';
import { Pagination } from '../components/Pagination';
import { SummaryCards } from '../components/SummaryCards';
import { describeError } from '../format';
import { Employee, Leave, StatusFilter, Summary } from '../types';

export function LeavesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const loadSummary = useCallback(() => {
    getSummary()
      .then((result) => {
        setSummary(result);
        setSummaryError('');
      })
      .catch((err) => setSummaryError(describeError(err, 'Could not load counts')));
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    listEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    listLeaves({ q, status, page }, controller.signal)
      .then((result) => {
        setLeaves(result.items);
        setTotalPages(result.totalPages);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(describeError(err, 'Could not load leave requests'));
        setLoading(false);
      });
    return () => controller.abort();
  }, [q, status, page, reloadKey]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleSearch = useCallback((value: string) => {
    setQ(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleDecision = useCallback(
    async (id: number, decision: 'approve' | 'reject') => {
      try {
        const updated = decision === 'approve' ? await approveLeave(id) : await rejectLeave(id);
        setLeaves((prev) => prev.map((leave) => (leave.id === updated.id ? { ...leave, status: updated.status } : leave)));
        loadSummary();
      } catch (err) {
        setNotice(describeError(err, `Could not ${decision} the request`));
      }
    },
    [leaves, loadSummary],
  );

  const handleCreated = useCallback(() => {
    setDialogOpen(false);
    setNotice('Leave request saved');
    setPage(1);
    setReloadKey((key) => key + 1);
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Leave Tracker</h1>
        <button type="button" className="button button--primary" data-testid="new-leave-button" onClick={() => setDialogOpen(true)}>
          + New leave
        </button>
      </header>

      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}

      <SummaryCards summary={summary} error={summaryError} />
      <Filters q={q} status={status} onSearch={handleSearch} onStatusChange={handleStatusChange} />

      {error ? (
        <p className="list-error" role="alert">
          {error}
        </p>
      ) : (
        <LeaveTable leaves={leaves} loading={loading} onDecision={handleDecision} />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <NewLeaveDialog open={dialogOpen} employees={employees} onClose={() => setDialogOpen(false)} onCreated={handleCreated} />
    </div>
  );
}
