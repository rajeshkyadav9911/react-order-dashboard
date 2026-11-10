export type Kind =
  'income' | 'expense' | 'transfer' | 'goal' | 'savings' | 'topup';
export type Category = 'Travel & transport' | 'Food' | 'Clothes' | 'Other';
export const categories: Category[] = [
  'Travel & transport',
  'Food',
  'Clothes',
  'Other',
];
export const colors = ['#ef86e1', '#b1dcfa', '#2bd4dc', '#e0e0e5'];
export const bucketNames = [
  'Fixed costs',
  'Personal spending',
  'Investments',
  'Savings',
];
export interface Entry {
  id: string;
  title: string;
  kind: Kind;
  cents: number;
  date: string;
  source: 'wallet' | 'card';
  category: Category;
  note: string;
}
export interface Contact {
  id: string;
  name: string;
  avatar?: string;
}
export interface Budget {
  month: string;
  limits: number[];
}
export interface State {
  version: 1;
  entries: Entry[];
  openingWallet: number;
  openingCard: number;
  openingGoal: number;
  openingSavings: number;
  target: number;
  frozen: boolean;
  name: string;
  privateMode: boolean;
  contacts: Contact[];
  budgets: Budget[];
  seen: string;
}
export type LedgerInput = Pick<
  Entry,
  'kind' | 'title' | 'source' | 'category' | 'note'
> & { amount: string };
export const uid = () => crypto.randomUUID();
export const monthKey = (date = new Date()) =>
  date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
export const monthDate = (key: string) =>
  new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
export const monthLabel = (key: string, long = false) =>
  monthDate(key).toLocaleDateString(
    'en-US',
    long ? { month: 'long', year: 'numeric' } : { month: 'short' },
  );
export function keyAgo(n: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  return monthKey(d);
}
export const cash = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
export function parseCents(raw: string) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(raw.trim()))
    throw new Error('Enter a positive amount with up to two decimal places.');
  const [whole, fraction = ''] = raw.trim().split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!cents) throw new Error('Enter an amount greater than zero.');
  return cents;
}
export const outflow = (e: Entry) =>
  e.kind === 'expense' || e.kind === 'transfer';
export function balances(s: State) {
  let wallet = s.openingWallet,
    card = s.openingCard,
    goal = s.openingGoal,
    savings = s.openingSavings;
  for (const e of s.entries) {
    if (e.kind === 'income') wallet += e.cents;
    else if (e.source === 'card') card -= e.cents;
    else wallet -= e.cents;
    if (e.kind === 'topup') card += e.cents;
    if (e.kind === 'goal') goal += e.cents;
    if (e.kind === 'savings') savings += e.cents;
  }
  return { wallet, card, goal, savings };
}
export function monthEntries(s: State, key = monthKey()) {
  return s.entries.filter((e) => monthKey(new Date(e.date)) === key);
}
export function flow(s: State, kind: 'income' | 'spending', key = monthKey()) {
  return monthEntries(s, key)
    .filter((e) => (kind === 'income' ? e.kind === 'income' : outflow(e)))
    .reduce((sum, e) => sum + e.cents, 0);
}
export function addEntry(s: State, input: LedgerInput) {
  const cents = parseCents(input.amount);
  const title = input.title.trim();
  if (!title || title.length > 70)
    throw new Error('Enter a name of up to 70 characters.');
  if (input.note.trim().length > 180)
    throw new Error('Keep the note under 181 characters.');
  if (input.kind !== 'expense' && input.source === 'card')
    throw new Error('Only a purchase can use the card.');
  const b = balances(s);
  if (input.source === 'card' && s.frozen)
    throw new Error('Unfreeze your card before recording a card purchase.');
  if (input.kind !== 'income' && cents > b[input.source])
    throw new Error('There are not enough funds in this account.');
  s.entries.unshift({
    id: uid(),
    title,
    source: input.source,
    kind: input.kind,
    category: input.category,
    note: input.note.trim(),
    cents,
    date: new Date().toISOString(),
  });
}
export const defaultLimits = [120000, 100000, 60000, 80000];
export function budgetFor(s: State, month: string) {
  return s.budgets.find((b) => b.month === month)?.limits ?? defaultLimits;
}
export function seed(): State {
  const now = new Date();
  const entries: Entry[] = [];
  function sample(
    title: string,
    kind: Kind,
    cents: number,
    daysAgo: number,
    hour: number,
    source: Entry['source'],
    category: Category,
  ) {
    const day = new Date(
      now.getFullYear(),
      now.getMonth(),
      Math.max(1, now.getDate() - daysAgo),
      hour,
      15,
    );
    const time = Math.min(
      day.getTime(),
      now.getTime() - (entries.length + 1) * 60000,
    );
    entries.push({
      id: 'sample-' + entries.length,
      title,
      kind,
      cents,
      source,
      category,
      note: '',
      date: new Date(time).toISOString(),
    });
  }
  sample('Adobe Creative Cloud', 'expense', 2695, 1, 19, 'card', 'Other');
  sample('Walmart', 'expense', 13854, 2, 18, 'card', 'Food');
  sample('Apple', 'expense', 2090, 3, 10, 'card', 'Other');
  sample('PayPal', 'expense', 4989, 4, 11, 'card', 'Other');
  sample('Chase', 'income', 156333, 5, 16, 'wallet', 'Other');
  sample('City Rail', 'expense', 35781, 6, 13, 'card', 'Travel & transport');
  sample('Market Kitchen', 'expense', 8509, 6, 12, 'card', 'Food');
  sample('Studio Supply', 'expense', 17890, 6, 10, 'card', 'Clothes');
  sample('Stream Plus', 'expense', 3644, 7, 14, 'card', 'Other');
  sample('Internet & utilities', 'expense', 46448, 8, 11, 'wallet', 'Other');
  sample('Freelance design', 'income', 87267, 9, 9, 'wallet', 'Other');
  const lastMonth = monthDate(keyAgo(1));
  lastMonth.setDate(15);
  entries.push(
    {
      id: 'previous-pay',
      title: 'Client payout',
      kind: 'income',
      cents: 221455,
      date: lastMonth.toISOString(),
      source: 'wallet',
      category: 'Other',
      note: '',
    },
    {
      id: 'previous-bill',
      title: 'Monthly bills',
      kind: 'expense',
      cents: 133235,
      date: lastMonth.toISOString(),
      source: 'wallet',
      category: 'Other',
      note: '',
    },
  );
  entries.sort((a, b) => b.date.localeCompare(a.date));
  const plans = [
    [1600, 1150, 780, 900],
    [1700, 1400, 550, 1450],
    [400, 760, 1240, 500],
    [850, 1450, 620, 1950],
    [980, 720, 640, 400],
    [450, 750, 1800, 530],
  ];
  const s: State = {
    version: 1,
    entries,
    openingWallet: 0,
    openingCard: 0,
    openingGoal: 170000,
    openingSavings: 136400,
    target: 340000,
    frozen: false,
    name: 'Rajesh Yadav',
    privateMode: false,
    seen: '',
    contacts: [
      { id: 'alex', name: 'Alex Chen', avatar: 'alex' },
      { id: 'maya', name: 'Maya Reed', avatar: 'maya' },
      { id: 'noah', name: 'Noah Ellis', avatar: 'noah' },
    ],
    budgets: plans.map((plan, i) => ({
      month: keyAgo(5 - i),
      limits: plan.map((v) => v * 100),
    })),
  };
  const initial = balances(s);
  s.openingWallet = 2523000 - initial.wallet;
  s.openingCard = 147600 - initial.card;
  return s;
}
