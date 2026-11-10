import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  balances,
  budgetFor,
  bucketNames,
  cash,
  categories,
  monthLabel,
  parseCents,
  type Category,
  type Kind,
  type LedgerInput,
  type State,
} from './model';
import { Avatar } from './ui';

export function SubmitForm({
  children,
  label,
  onSubmit,
}: {
  children: ReactNode;
  label: string;
  onSubmit: () => Promise<void>;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    pending = useRef(false);
  async function handle(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await onSubmit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this change.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={handle}>
      {children}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="primary" disabled={busy}>
        {busy ? 'Saving…' : label}
      </button>
    </form>
  );
}
export function EntryForm({
  state,
  kind,
  initialSource = 'wallet',
  recipient,
  onSave,
}: {
  state: State;
  kind: Kind;
  initialSource?: 'wallet' | 'card';
  recipient?: string;
  onSave: (e: LedgerInput) => Promise<void>;
}) {
  const [name, setName] = useState(''),
    [amount, setAmount] = useState(''),
    [note, setNote] = useState(''),
    [category, setCategory] = useState<Category>('Other');
  const [account, setAccount] = useState(initialSource),
    [contactId, setContactId] = useState(
      recipient ?? state.contacts[0]?.id ?? '',
    );
  const contact = state.contacts.find((p) => p.id === contactId);
  const titles: Record<Kind, string> = {
    transfer: contact?.name ?? '',
    expense: name,
    income: name,
    goal: 'Goal contribution',
    savings: 'Savings deposit',
    topup: 'Visa top-up',
  };
  const action: Record<Kind, string> = {
    transfer: 'Confirm transfer',
    expense: 'Save expense',
    income: 'Save income',
    goal: 'Add to goal',
    savings: 'Add to savings',
    topup: 'Top up card',
  };
  const available = state.privateMode ? '••••' : cash(balances(state)[account]);
  return (
    <SubmitForm
      label={action[kind]}
      onSubmit={() =>
        onSave({
          kind,
          title: titles[kind],
          amount,
          category,
          source: account,
          note,
        })
      }
    >
      {kind === 'transfer' && (
        <div className="recipient-select">
          {contact && <Avatar contact={contact} />}
          <label>
            Recipient
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              {state.contacts.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {(kind === 'expense' || kind === 'income') && (
        <label>
          {kind === 'expense' ? 'Merchant or payee' : 'Income source'}
          <input
            required
            maxLength={70}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              kind === 'income' ? 'e.g. Client payment' : 'e.g. Corner market'
            }
          />
        </label>
      )}
      {kind === 'expense' && (
        <div className="field-pair">
          <label>
            Pay from
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value as 'wallet' | 'card')}
            >
              <option value="wallet">Wallet</option>
              <option value="card">Visa card</option>
            </select>
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <label>
        Amount (USD)
        <input
          required
          inputMode="decimal"
          placeholder="0.00"
          autoComplete="off"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      {kind !== 'income' && (
        <p className="hint">
          Available in {account === 'card' ? 'Visa card' : 'wallet'} ·{' '}
          {available}
        </p>
      )}
      <label>
        Note <span className="optional">(optional)</span>
        <input
          maxLength={180}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a short note"
        />
      </label>
      <p className="hint">Demo account · This entry is saved on this device.</p>
    </SubmitForm>
  );
}
export function BudgetForm({
  state,
  month,
  onSave,
}: {
  state: State;
  month: string;
  onSave: (limits: number[]) => Promise<void>;
}) {
  const [values, setValues] = useState(
    budgetFor(state, month).map((v) => (v / 100).toFixed(2)),
  );
  return (
    <SubmitForm
      label="Save budget"
      onSubmit={() =>
        onSave(
          values.map((v) => (/^0+(\.0{1,2})?$/.test(v) ? 0 : parseCents(v))),
        )
      }
    >
      <p className="hint">
        {monthLabel(month, true)} · Monthly allocations in USD
      </p>
      {bucketNames.map((name, i) => (
        <label key={name}>
          {name}
          <input
            inputMode="decimal"
            required
            value={values[i]}
            onChange={(e) =>
              setValues(values.map((v, j) => (j === i ? e.target.value : v)))
            }
          />
        </label>
      ))}
    </SubmitForm>
  );
}
export function NameForm({
  label,
  value = '',
  button,
  onSave,
}: {
  label: string;
  value?: string;
  button: string;
  onSave: (v: string) => Promise<void>;
}) {
  const [name, setName] = useState(value);
  return (
    <SubmitForm label={button} onSubmit={() => onSave(name.trim())}>
      <label>
        {label}
        <input
          required
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
    </SubmitForm>
  );
}
