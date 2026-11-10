import { useState } from 'react';
import { ChevronDown, ListFilter, Search } from 'lucide-react';
import {
  cash,
  keyAgo,
  monthKey,
  outflow,
  type Entry,
  type State,
} from './model';
import { Jump, Merchant } from './ui';

export type HistoryTab = 'All' | 'Income' | 'Spending';
export function History({
  state,
  compact = false,
  tab,
  onTab,
  onExpand,
  onEntry,
}: {
  state: State;
  compact?: boolean;
  tab: HistoryTab;
  onTab: (t: HistoryTab) => void;
  onExpand: () => void;
  onEntry: (e: Entry) => void;
}) {
  const [filters, setFilters] = useState(false),
    [period, setPeriod] = useState('all'),
    [source, setSource] = useState('all'),
    [query, setQuery] = useState('');
  const matches = state.entries.filter(
    (e) =>
      (tab === 'All' ||
        (tab === 'Income' ? e.kind === 'income' : outflow(e))) &&
      (period === 'all' ||
        monthKey(new Date(e.date)) ===
          (period === 'current' ? monthKey() : keyAgo(1))) &&
      (source === 'all' || e.source === source) &&
      (e.title + ' ' + e.note)
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const entries = compact ? matches.slice(0, 5) : matches;
  return (
    <section
      className={'panel history ' + (compact ? 'compact' : 'expanded')}
      aria-label="Transaction history"
    >
      <div className="panel-head">
        <h2>Transaction history</h2>
        {compact && <Jump label="View all transactions" onClick={onExpand} />}
      </div>
      <div className="history-tools">
        <div className="segmented" aria-label="Transaction type">
          {(['All', 'Income', 'Spending'] as const).map((t) => (
            <button key={t} aria-pressed={t === tab} onClick={() => onTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <button
          className={
            'filter-toggle' +
            (period !== 'all' || source !== 'all' ? ' active' : '')
          }
          aria-expanded={filters}
          onClick={() => setFilters(!filters)}
        >
          Filter <ListFilter size={13} />
        </button>
      </div>
      {filters && (
        <div className="filter-fields">
          <label>
            Period
            <select
              aria-label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">All dates</option>
              <option value="current">This month</option>
              <option value="previous">Last month</option>
            </select>
          </label>
          <label>
            Account
            <select
              aria-label="Account"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="all">All accounts</option>
              <option value="wallet">Wallet</option>
              <option value="card">Visa card</option>
            </select>
          </label>
        </div>
      )}
      {!compact && (
        <label className="search">
          <Search size={16} />
          <input
            aria-label="Search transactions"
            placeholder="Search by name or note"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}
      <div className="entries">
        {entries.map((e) => (
          <button key={e.id} className="entry" onClick={() => onEntry(e)}>
            <Merchant entry={e} />
            <span className="entry-info">
              <strong>{e.title}</strong>
              <small>
                {new Date(e.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                ·{' '}
                {new Date(e.date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </small>
            </span>
            <b>
              {state.privateMode
                ? '••••'
                : (e.kind === 'income' ? '+' : '−') + cash(e.cents)}
            </b>
          </button>
        ))}
        {!entries.length && (
          <p className="empty">No transactions match these filters.</p>
        )}
      </div>
      {!compact && (
        <p className="result-count">
          {matches.length} transaction{matches.length !== 1 ? 's' : ''}
        </p>
      )}
    </section>
  );
}
export function PeriodPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="period">
      <select
        aria-label="Chart period"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      >
        <option value={3}>3 months</option>
        <option value={6}>6 months</option>
        <option value={12}>12 months</option>
      </select>
      <ChevronDown size={12} />
    </label>
  );
}
