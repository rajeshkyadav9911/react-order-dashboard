import {
  balances,
  bucketNames,
  budgetFor,
  cash,
  categories,
  colors,
  keyAgo,
  monthEntries,
  monthLabel,
  type State,
} from './model';

export function Sparkline({ state }: { state: State }) {
  const now = new Date();
  const wallet = balances(state).wallet;
  const values = Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now);
    t.setDate(t.getDate() - (23 - i));
    t.setHours(23, 59, 59, 999);
    return state.entries.reduce(
      (v, e) =>
        e.source === 'wallet' && new Date(e.date) > t
          ? v + (e.kind === 'income' ? -e.cents : e.cents)
          : v,
      wallet,
    );
  });
  const min = Math.min(...values),
    span = Math.max(1, Math.max(...values) - min);
  return (
    <div
      className="spark"
      aria-label="Wallet balance over the last 24 days"
      role="img"
    >
      {values.map((v, i) => (
        <i key={i} style={{ height: 8 + (88 * (v - min)) / span + '%' }} />
      ))}
    </div>
  );
}
export function Spending({
  state,
  details,
  onOpen,
}: {
  state: State;
  details?: boolean;
  onOpen?: () => void;
}) {
  const purchases = monthEntries(state).filter(
    (e) => e.source === 'card' && e.kind === 'expense',
  );
  const totals = categories.map((c) =>
    purchases.filter((e) => e.category === c).reduce((a, e) => a + e.cents, 0),
  );
  const total = totals.reduce((a, v) => a + v, 0);
  const shown = (n: number) => (state.privateMode ? '••••' : cash(n));
  let end = Math.PI;
  const arcs = totals.map((n, i) => {
    const width = total ? (n / total) * Math.PI : 0;
    const start = end;
    end += width;
    if (!n) return null;
    const gap = Math.min(0.035, width / 3);
    const point = (a: number) =>
      [122 - 106 * Math.cos(a), 133 + 106 * Math.sin(a)].join(' ');
    return (
      <path
        key={i}
        d={'M ' + point(start + gap) + ' A 106 106 0 0 0 ' + point(end - gap)}
        fill="none"
        stroke={colors[i]}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    );
  });
  return (
    <div className={'spending-content' + (details ? ' detailed' : '')}>
      <div className="gauge">
        <svg viewBox="0 0 244 145" aria-hidden="true">
          <path
            d="M 16 133 A 106 106 0 0 1 228 133"
            fill="none"
            stroke="#373637"
            strokeWidth="2"
          />
          <path
            d="M 94 71 L 78 31 Q 122 13 166 31 L 150 71 Q 122 61 94 71Z"
            fill="#343335"
          />
          {arcs}
        </svg>
        <strong>{shown(total)}</strong>
      </div>
      <div className="spend-legend">
        {categories.map((c, i) => (
          <div key={c}>
            <i style={{ background: colors[i] }} />
            <span>{c}</span>
            <b>
              {details
                ? shown(totals[i])
                : (total ? Math.round((totals[i] / total) * 100) : 0) + '%'}
            </b>
          </div>
        ))}
      </div>
      {details && (
        <button className="primary" onClick={onOpen}>
          Record a card purchase
        </button>
      )}
    </div>
  );
}
export function BudgetChart({
  state,
  months,
  onPick,
}: {
  state: State;
  months: number;
  onPick: (m: string) => void;
}) {
  const data = Array.from({ length: months }, (_, i) => {
    const month = keyAgo(months - 1 - i);
    return { month, parts: budgetFor(state, month) };
  });
  const largest = Math.max(
    ...data.map((d) => d.parts.reduce((a, b) => a + b, 0)),
  );
  const step = Math.max(100000, Math.ceil(largest / 3 / 100000) * 100000),
    max = step * 3;
  return (
    <>
      <div className="budget-plot">
        <div className="ticks">
          {[3, 2, 1, 0].map((n) => (
            <span key={n}>{n ? (step * n) / 100000 + 'K' : '0'}</span>
          ))}
        </div>
        <div className="bars">
          {data.map(({ month, parts }) => (
            <button
              type="button"
              className="bar-column"
              key={month}
              aria-label={'Edit ' + monthLabel(month, true) + ' budget'}
              title={monthLabel(month, true)}
              onClick={() => onPick(month)}
            >
              <span className="bar">
                {parts.map((v, i) => (
                  <i
                    key={i}
                    style={{
                      height: (100 * v) / max + '%',
                      background: barColors[i],
                    }}
                  />
                ))}
              </span>
              <span className="month">{monthLabel(month)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="budget-legend">
        {bucketNames.map((n, i) => (
          <span key={n}>
            <i style={{ background: barColors[i] }} />
            {n}
          </span>
        ))}
      </div>
    </>
  );
}
export const barColors = ['#414446', '#566169', '#8294a3', '#b9e0fa'];
