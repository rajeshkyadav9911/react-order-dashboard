import { useEffect, useState, type CSSProperties } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Flag,
  House,
  LayoutGrid,
  NotebookTabs,
  Plus,
  Send,
  Settings2,
  Snowflake,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react';
import {
  balances,
  addEntry,
  bucketNames,
  budgetFor,
  cash,
  categories,
  colors,
  flow,
  keyAgo,
  monthEntries,
  monthKey,
  monthLabel,
  outflow,
  parseCents,
  uid,
  type Entry,
  type Kind,
  type State,
} from './model';
import { useDashboard } from './store';
import { BudgetChart, Sparkline, Spending, barColors } from './Charts';
import { History, PeriodPicker, type HistoryTab } from './History';
import { Avatar, Jump, Merchant, Modal, Money } from './ui';
import { BudgetForm, EntryForm, NameForm, SubmitForm } from './Forms';
import portrait from './assets/profile.png';

const pages = [
  'Home',
  'Analytics',
  'Transactions',
  'Payment',
  'Plan',
  'Cards',
] as const;
type Page = (typeof pages)[number];
const icons = [
  House,
  ChartNoAxesCombined,
  ArrowLeftRight,
  WalletCards,
  NotebookTabs,
  CreditCard,
];
type Dialog =
  | {
      type: 'entry';
      kind: Kind;
      recipient?: string;
      source?: 'wallet' | 'card';
    }
  | { type: 'detail'; entry: Entry }
  | { type: 'budget'; month: string }
  | {
      type:
        | 'goal'
        | 'savings'
        | 'balance'
        | 'spending'
        | 'contact'
        | 'profile'
        | 'preferences'
        | 'notifications'
        | 'target';
    };
const formTitles: Record<Kind, string> = {
  expense: 'Record expense',
  income: 'Record income',
  goal: 'Add to goal',
  savings: 'Add to savings',
  topup: 'Top up Visa card',
  transfer: 'Quick transfer',
};
const labels: Record<Kind, string> = {
  income: 'Income',
  expense: 'Purchase',
  transfer: 'Transfer',
  topup: 'Card top-up',
  goal: 'Goal contribution',
  savings: 'Savings deposit',
};
function locationPage(): Page {
  return (
    pages.find(
      (v) => v.toLowerCase() === location.hash.slice(1).toLowerCase(),
    ) ?? 'Home'
  );
}
export default function App() {
  const { state, update } = useDashboard();
  const [page, setPage] = useState<Page>(locationPage),
    [modal, setModal] = useState<Dialog | null>(null),
    [tab, setTab] = useState<HistoryTab>('All');
  const [period, setPeriod] = useState(6),
    [notice, setNotice] = useState('');
  const [reportMonth, setReportMonth] = useState(monthKey);
  const b = balances(state),
    hidden = state.privateMode;
  const show = (n: number) => (hidden ? '••••' : cash(n));
  useEffect(() => {
    const sync = () => {
      setPage(locationPage());
      setModal(null);
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  function navigate(p: Page) {
    setModal(null);
    setPage(p);
    location.hash = p.toLowerCase();
    window.scrollTo(0, 0);
  }
  function history(t: HistoryTab) {
    setTab(t);
    navigate('Transactions');
  }
  function entry(
    kind: Kind,
    source: 'wallet' | 'card' = 'wallet',
    recipient?: string,
  ) {
    setModal({ type: 'entry', kind, source, recipient });
  }
  async function save(change: (s: State) => void, message: string) {
    await update(change);
    setModal(null);
    setNotice(message);
  }
  async function toggle(change: (s: State) => void, message: string) {
    try {
      await update(change);
      setNotice(message);
    } catch {
      setNotice('Could not save changes on this device.');
    }
  }
  const unread = state.entries
    .filter((e) => !state.seen || e.date > state.seen)
    .slice(0, 5);
  function metric(kind: 'income' | 'spending') {
    const val = flow(state, kind),
      prev = flow(state, kind, keyAgo(1)),
      diff = prev ? Math.round(((val - prev) / prev) * 100) : null;
    return (
      <button
        className="panel metric"
        onClick={() => history(kind === 'income' ? 'Income' : 'Spending')}
      >
        <span className="metric-top">
          <span>{kind === 'income' ? 'Income' : 'Expense'}</span>
          <span className="delta">
            {diff === null ? (
              '—'
            ) : (
              <>
                {diff >= 0 ? '▴' : '▾'} {Math.abs(diff)}%
              </>
            )}
          </span>
        </span>
        <strong>
          <Money cents={val} hidden={hidden} />
        </strong>
      </button>
    );
  }
  function totalCard() {
    const net = flow(state, 'income') - flow(state, 'spending');
    return (
      <section className="panel total">
        <div className="panel-head">
          <h2>Total balance</h2>
          <Jump
            label="View wallet balance"
            onClick={() => setModal({ type: 'balance' })}
          />
        </div>
        <div className="hero-money">
          <Money cents={b.wallet} hidden={hidden} />
        </div>
        <div className="total-foot">
          <span className="light-chip">
            <Wallet size={12} /> Wallet
          </span>
          <span className="light-chip" title="This month’s net income">
            {hidden ? '••••' : (net >= 0 ? '+' : '−') + cash(Math.abs(net))}
          </span>
          <Sparkline state={state} />
        </div>
      </section>
    );
  }
  function mini(kind: 'goal' | 'savings') {
    return (
      <section
        className={'panel mini ' + kind}
        style={
          kind === 'goal'
            ? ({
                '--goal-fill':
                  Math.min(100, (b.goal / state.target) * 100) + '%',
              } as CSSProperties)
            : undefined
        }
      >
        <div className="panel-head">
          <h2>{kind === 'goal' ? 'My Goal' : 'Savings'}</h2>
          <Jump
            label={
              kind === 'goal' ? 'View savings goal' : 'View savings account'
            }
            onClick={() => setModal({ type: kind })}
          />
        </div>
        <div className="mini-money">
          {kind === 'goal' ? (
            <>
              {hidden ? '••••' : '$' + (b.goal / 100).toLocaleString('en-US')}
              <small>
                {' '}
                /{' '}
                {hidden
                  ? '••••'
                  : '$' + (state.target / 100).toLocaleString('en-US')}
              </small>
            </>
          ) : (
            <Money cents={b.savings} hidden={hidden} />
          )}
        </div>
      </section>
    );
  }
  function quick(expanded = false) {
    return (
      <section className={'panel quick' + (expanded ? ' wide' : '')}>
        <div className="panel-head">
          <h2>Quick transfer</h2>
        </div>
        <div className="contacts">
          {state.contacts.map((c) => (
            <button
              key={c.id}
              className="contact"
              title={'Send to ' + c.name}
              aria-label={'Send to ' + c.name}
              onClick={() => entry('transfer', 'wallet', c.id)}
            >
              <Avatar contact={c} />
              {expanded && <span>{c.name}</span>}
            </button>
          ))}
          <button
            className="add-contact"
            aria-label="Add contact"
            title="Add contact"
            onClick={() => setModal({ type: 'contact' })}
          >
            <Plus size={18} />
          </button>
        </div>
      </section>
    );
  }
  function budget() {
    return (
      <section className="panel budget">
        <div className="panel-head">
          <h2>Budget</h2>
          <div className="head-actions">
            <PeriodPicker value={period} onChange={setPeriod} />
            <Jump
              label="Edit this month’s budget"
              onClick={() => setModal({ type: 'budget', month: monthKey() })}
            />
          </div>
        </div>
        <BudgetChart
          state={state}
          months={period}
          onPick={(month) => setModal({ type: 'budget', month })}
        />
      </section>
    );
  }
  function card() {
    return (
      <section className={'panel visa' + (state.frozen ? ' frozen' : '')}>
        <div className="panel-head">
          <span className="visa-logo">VISA</span>
          {page !== 'Cards' ? (
            <Jump label="Manage Visa card" onClick={() => navigate('Cards')} />
          ) : (
            <CreditCard aria-label="Virtual card" />
          )}
        </div>
        <div className="card-value">
          <Money cents={b.card} hidden={hidden} />
        </div>
        <div className="card-meta">
          <span>••7954</span>
          <span>05/29</span>
          {state.frozen && <span>Frozen</span>}
        </div>
      </section>
    );
  }
  function transactions(compact = false) {
    return (
      <History
        state={state}
        compact={compact}
        tab={tab}
        onTab={setTab}
        onEntry={(e) => setModal({ type: 'detail', entry: e })}
        onExpand={() => history(tab)}
      />
    );
  }
  function spend() {
    return (
      <section className="panel spending">
        <div className="panel-head">
          <h2>Top spending</h2>
          <Jump
            label="View card spending breakdown"
            onClick={() => setModal({ type: 'spending' })}
          />
        </div>
        <Spending state={state} />
      </section>
    );
  }
  function actions(
    items: { label: string; icon: typeof Wallet; run: () => void }[],
  ) {
    return (
      <div className="action-list">
        {items.map(({ label, icon: Icon, run }) => (
          <button key={label} onClick={run}>
            <Icon size={19} />
            <span>{label}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    );
  }
  const entryDetail = modal?.type === 'detail' ? modal.entry : undefined;
  const title =
    modal?.type === 'entry'
      ? formTitles[modal.kind]
      : modal?.type === 'budget'
        ? 'Edit budget'
        : modal?.type === 'detail'
          ? 'Transaction details'
          : (
              {
                goal: 'My Goal',
                savings: 'Savings account',
                balance: 'Wallet balance',
                spending: 'Card spending this month',
                contact: 'Add contact',
                profile: 'Your profile',
                preferences: 'Display settings',
                notifications: 'Notifications',
                target: 'Edit goal target',
              } as Record<string, string>
            )[modal?.type ?? ''];
  return (
    <div className="frame">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate('Home')}
          aria-label="Novamint home"
        >
          <span className="brand-mark">
            <WalletCards size={23} />
          </span>
          Novamint
        </button>
        <nav aria-label="Main navigation">
          {pages.map((p, i) => {
            const Icon = icons[i];
            return (
              <button
                key={p}
                className={p === page ? 'selected' : ''}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => navigate(p)}
              >
                <Icon size={15} />
                {p}
              </button>
            );
          })}
        </nav>
        <div className="utilities">
          <button
            className="circle"
            aria-label="Notifications"
            onClick={() => setModal({ type: 'notifications' })}
          >
            <Bell size={18} />
          </button>
          <button
            className="circle"
            aria-label="Display settings"
            onClick={() => setModal({ type: 'preferences' })}
          >
            <Settings2 size={18} />
          </button>
          <button
            className="profile"
            aria-label="Your profile"
            onClick={() => setModal({ type: 'profile' })}
          >
            <img src={portrait} alt="" />
          </button>
        </div>
      </header>
      <main>
        {page === 'Home' ? (
          <>
            <h1 className="sr-only">Financial dashboard</h1>
            <div className="dashboard">
              <div className="left-column">
                <div className="metrics">
                  {metric('income')}
                  {metric('spending')}
                </div>
                {spend()}
                {quick()}
              </div>
              <div className="middle-column">
                {totalCard()}
                <div className="mini-row">
                  {mini('goal')}
                  {mini('savings')}
                </div>
                {budget()}
              </div>
              <div className="right-column">
                {transactions(true)}
                {card()}
              </div>
            </div>
          </>
        ) : (
          <div className="subpage">
            <div className="page-heading">
              <h1>{page}</h1>
              {page === 'Transactions' && (
                <button className="primary" onClick={() => entry('expense')}>
                  <Plus size={16} /> Record expense
                </button>
              )}
              {page === 'Analytics' && (
                <select
                  aria-label="Report month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                >
                  {Array.from({ length: 6 }, (_, i) => keyAgo(i)).map((k) => (
                    <option key={k} value={k}>
                      {monthLabel(k, true)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {page === 'Transactions' && transactions()}
            {page === 'Analytics' && (
              <>
                <div className="summary-row">
                  {[
                    ['Income', flow(state, 'income', reportMonth)],
                    ['Expense', flow(state, 'spending', reportMonth)],
                    [
                      'Net cash flow',
                      flow(state, 'income', reportMonth) -
                        flow(state, 'spending', reportMonth),
                    ],
                  ].map(([n, v]) => (
                    <div className="panel summary" key={n}>
                      <h2>{n}</h2>
                      <strong>{show(Number(v))}</strong>
                    </div>
                  ))}
                </div>
                <section className="panel section-card">
                  <h2>Spending by category</h2>
                  <div className="analysis-list">
                    {categories.map((c, i) => {
                      const rows = monthEntries(state, reportMonth).filter(
                          (e) => outflow(e) && e.category === c,
                        ),
                        sum = rows.reduce((a, e) => a + e.cents, 0);
                      return (
                        <div key={c}>
                          <div>
                            <span>{c}</span>
                            <b>{show(sum)}</b>
                          </div>
                          <progress
                            aria-label={c}
                            value={sum}
                            max={flow(state, 'spending', reportMonth) || 1}
                            style={{ accentColor: colors[i] }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
            {page === 'Payment' && (
              <div className="two-column">
                <div>
                  {totalCard()}
                  {quick(true)}
                </div>
                <section className="panel section-card">
                  <h2>Wallet actions</h2>
                  {actions([
                    {
                      label: 'Send money',
                      icon: Send,
                      run: () => entry('transfer'),
                    },
                    {
                      label: 'Record income',
                      icon: ArrowDownLeft,
                      run: () => entry('income'),
                    },
                    {
                      label: 'Record expense',
                      icon: ArrowUpRight,
                      run: () => entry('expense'),
                    },
                    {
                      label: 'Top up Visa card',
                      icon: CreditCard,
                      run: () => entry('topup'),
                    },
                  ])}
                </section>
              </div>
            )}
            {page === 'Plan' && (
              <>
                <div className="plan-row">
                  {mini('goal')}
                  {mini('savings')}
                </div>
                <div className="two-column">
                  {budget()}
                  <section className="panel section-card">
                    <div className="panel-head">
                      <h2>{monthLabel(monthKey(), true)} budget</h2>
                      <Jump
                        label="Change budget limits"
                        onClick={() =>
                          setModal({ type: 'budget', month: monthKey() })
                        }
                      />
                    </div>
                    <div className="allocation">
                      {bucketNames.map((n, i) => (
                        <div key={n}>
                          <i style={{ background: barColors[i] }} />
                          {n}
                          <b>{show(budgetFor(state, monthKey())[i])}</b>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            )}
            {page === 'Cards' && (
              <div className="two-column">
                <div>
                  {card()}
                  <p className="card-state">
                    <span className={state.frozen ? 'off' : ''} />
                    {state.frozen ? 'Card frozen' : 'Card active'} · Virtual
                    debit card
                  </p>
                </div>
                <section className="panel section-card">
                  <h2>Card controls</h2>
                  {actions([
                    {
                      label: 'Top up card',
                      icon: Plus,
                      run: () => entry('topup'),
                    },
                    {
                      label: 'Record card purchase',
                      icon: CreditCard,
                      run: () => entry('expense', 'card'),
                    },
                    {
                      label: state.frozen ? 'Unfreeze card' : 'Freeze card',
                      icon: Snowflake,
                      run: () =>
                        void toggle((s) => {
                          s.frozen = !s.frozen;
                        }, 'Card status updated.'),
                    },
                    {
                      label: 'View spending breakdown',
                      icon: Activity,
                      run: () => setModal({ type: 'spending' }),
                    },
                  ])}
                </section>
              </div>
            )}
          </div>
        )}
      </main>
      {modal && (
        <Modal key={modal.type} title={title} onClose={() => setModal(null)}>
          {modal.type === 'entry' && (
            <EntryForm
              state={state}
              kind={modal.kind}
              initialSource={modal.source}
              recipient={modal.recipient}
              onSave={(input) =>
                save((s) => addEntry(s, input), 'Transaction saved.')
              }
            />
          )}
          {modal.type === 'budget' && (
            <BudgetForm
              state={state}
              month={modal.month}
              onSave={(limits) =>
                save((s) => {
                  s.budgets = s.budgets
                    .filter((b) => b.month !== modal.month)
                    .concat({ month: modal.month, limits });
                }, 'Budget updated.')
              }
            />
          )}
          {modal.type === 'spending' && (
            <Spending
              state={state}
              details
              onOpen={() => entry('expense', 'card')}
            />
          )}
          {modal.type === 'contact' && (
            <NameForm
              label="Contact name"
              button="Add contact"
              onSave={(name) =>
                save((s) => {
                  if (!name) throw new Error('Enter a contact name.');
                  if (
                    s.contacts.some(
                      (c) => c.name.toLowerCase() === name.toLowerCase(),
                    )
                  )
                    throw new Error('A contact with this name already exists.');
                  s.contacts.push({ id: uid(), name });
                }, 'Contact added.')
              }
            />
          )}
          {modal.type === 'profile' && (
            <>
              <div className="profile-detail">
                <img src={portrait} alt="" />
                Local demo profile
              </div>
              <NameForm
                label="Display name"
                value={state.name}
                button="Save profile"
                onSave={(name) =>
                  save((s) => {
                    if (!name) throw new Error('Enter a display name.');
                    s.name = name;
                  }, 'Profile saved.')
                }
              />
            </>
          )}
          {modal.type === 'preferences' && (
            <div className="settings-row">
              <div>
                <strong>Hide amounts</strong>
                <p>Mask balances and transaction amounts.</p>
              </div>
              <button
                className="circle"
                aria-label="Hide amounts"
                aria-pressed={hidden}
                onClick={() =>
                  void toggle((s) => {
                    s.privateMode = !s.privateMode;
                  }, 'Display settings saved.')
                }
              >
                {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}
          {modal.type === 'notifications' && (
            <>
              {unread.length ? (
                <div className="notification-list">
                  {unread.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setModal({ type: 'detail', entry: e })}
                    >
                      <Merchant entry={e} />
                      <span>
                        {e.title}
                        <small>{labels[e.kind]} recorded</small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                  <button
                    className="ghost"
                    onClick={() =>
                      void toggle((s) => {
                        s.seen = new Date().toISOString();
                      }, 'Notifications marked as read.')
                    }
                  >
                    Mark all as read
                  </button>
                </div>
              ) : (
                <p className="empty">You’re all caught up.</p>
              )}
            </>
          )}
          {modal.type === 'balance' && (
            <>
              <div className="detail-amount">{show(b.wallet)}</div>
              <p className="hint">Available wallet balance · USD</p>
              {actions([
                {
                  label: 'Record income',
                  icon: Plus,
                  run: () => entry('income'),
                },
                {
                  label: 'Record expense',
                  icon: ArrowUpRight,
                  run: () => entry('expense'),
                },
                {
                  label: 'All transactions',
                  icon: LayoutGrid,
                  run: () => history('All'),
                },
              ])}
            </>
          )}
          {(modal.type === 'savings' || modal.type === 'goal') && (
            <>
              <div className="detail-amount">{show(b[modal.type])}</div>
              {modal.type === 'goal' && (
                <>
                  <p className="hint">
                    {Math.round((b.goal / state.target) * 100)}% of{' '}
                    {show(state.target)} target
                  </p>
                  <progress
                    aria-label="Goal progress"
                    value={b.goal}
                    max={state.target}
                  />
                </>
              )}
              {actions([
                {
                  label:
                    modal.type === 'goal' ? 'Add to goal' : 'Add to savings',
                  icon: Plus,
                  run: () => entry(modal.type === 'goal' ? 'goal' : 'savings'),
                },
                ...(modal.type === 'goal'
                  ? [
                      {
                        label: 'Edit target',
                        icon: Flag,
                        run: () => setModal({ type: 'target' }),
                      },
                    ]
                  : []),
              ])}
            </>
          )}
          {modal.type === 'target' && (
            <TargetForm
              value={state.target}
              save={(v) =>
                save((s) => {
                  s.target = parseCents(v);
                }, 'Goal target updated.')
              }
            />
          )}
          {entryDetail && (
            <>
              <div className="detail-merchant">
                <Merchant entry={entryDetail} />
                <h3>{entryDetail.title}</h3>
              </div>
              <div className="detail-amount">{show(entryDetail.cents)}</div>
              <dl className="detail-list">
                {[
                  ['Type', labels[entryDetail.kind]],
                  [
                    'Account',
                    entryDetail.source === 'wallet' ? 'Wallet' : 'Visa ••7954',
                  ],
                  ['Date', new Date(entryDetail.date).toLocaleString()],
                  ...(entryDetail.kind === 'expense'
                    ? [['Category', entryDetail.category]]
                    : []),
                  ...(entryDetail.note ? [['Note', entryDetail.note]] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
function TargetForm({
  value,
  save,
}: {
  value: number;
  save: (v: string) => Promise<void>;
}) {
  const [v, set] = useState((value / 100).toFixed(2));
  return (
    <SubmitForm label="Save target" onSubmit={() => save(v)}>
      <label>
        Target (USD)
        <input
          required
          value={v}
          inputMode="decimal"
          onChange={(e) => set(e.target.value)}
        />
      </label>
    </SubmitForm>
  );
}
