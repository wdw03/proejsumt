import { LeaveStatus, Summary } from '../types';

const CARDS: { status: LeaveStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'REJECTED', label: 'Rejected' },
];

export function SummaryCards({ summary, error }: { summary: Summary | null; error: string }) {
  return (
    <section className="summary" aria-label="Counts">
      {CARDS.map((card) => (
        <div key={card.status} className={`summary-card summary-card--${card.status.toLowerCase()}`}>
          <span className="summary-label">{card.label}</span>
          <span className="summary-value" data-testid={`summary-${card.status}`}>
            {summary ? summary[card.status] : '–'}
          </span>
        </div>
      ))}
      {error && (
        <p className="summary-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
