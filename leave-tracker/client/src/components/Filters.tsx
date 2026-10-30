import { useEffect, useState } from 'react';
import { STATUS_OPTIONS } from '../constants';
import { StatusFilter } from '../types';

interface Props {
  q: string;
  status: StatusFilter;
  onSearch: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
}

export function Filters({ q, status, onSearch, onStatusChange }: Props) {
  const [text, setText] = useState(q);

  // Search 300 ms after the user stops typing.
  useEffect(() => {
    const value = text.trim();
    if (value === q) return;
    const timer = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer);
  }, [text, q, onSearch]);

  return (
    <div className="filters">
      <label className="field field--grow">
        <span>Search</span>
        <input data-testid="search-input" type="search" placeholder="Employee name" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label className="field">
        <span>Status</span>
        <select data-testid="status-filter" value={status} onChange={(e) => onStatusChange(e.target.value as StatusFilter)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
