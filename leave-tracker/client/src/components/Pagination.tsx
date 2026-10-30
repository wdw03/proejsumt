interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  return (
    <nav className="pagination" aria-label="Pages">
      <button type="button" className="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        « Prev
      </button>
      <span data-testid="page-info">
        Page {page} of {totalPages}
      </span>
      <button type="button" className="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next »
      </button>
    </nav>
  );
}
