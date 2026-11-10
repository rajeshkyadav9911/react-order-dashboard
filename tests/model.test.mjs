import test from 'node:test';
import assert from 'node:assert/strict';
import { addEntry, balances, flow, parseCents, seed } from '../src/model.ts';

const item = (kind, amount, source = 'wallet') => ({
  kind,
  amount,
  source,
  title: 'Example',
  category: 'Other',
  note: '',
});

test('accepts decimal currency and rejects invalid or excessive precision', () => {
  assert.equal(parseCents('10.09'), 1009);
  for (const amount of ['0', '-10', 'NaN', '1.001', '1e3', ''])
    assert.throws(() => parseCents(amount));
});
test('initial assets reconcile to the reference layout', () => {
  assert.deepEqual(balances(seed()), {
    wallet: 2523000,
    card: 147600,
    goal: 170000,
    savings: 136400,
  });
});
test('a transfer debits the wallet and enters the spending report', () => {
  const s = seed(),
    old = flow(s, 'spending');
  addEntry(s, item('transfer', '12.34'));
  assert.equal(balances(s).wallet, 2521766);
  assert.equal(flow(s, 'spending') - old, 1234);
});
test('top-ups and reservations move assets without double counting spending', () => {
  const s = seed(),
    old = flow(s, 'spending');
  addEntry(s, item('topup', '100'));
  addEntry(s, item('goal', '25'));
  addEntry(s, item('savings', '10'));
  assert.deepEqual(balances(s), {
    wallet: 2509500,
    card: 157600,
    goal: 172500,
    savings: 137400,
  });
  assert.equal(flow(s, 'spending'), old);
});
test('a card purchase only debits the card and a frozen card refuses purchases', () => {
  const s = seed();
  addEntry(s, item('expense', '20.50', 'card'));
  assert.equal(balances(s).card, 145550);
  assert.equal(balances(s).wallet, 2523000);
  s.frozen = true;
  const count = s.entries.length;
  assert.throws(() => addEntry(s, item('expense', '1', 'card')), /Unfreeze/);
  assert.equal(s.entries.length, count);
});
test('an overdraft is refused without writing an entry', () => {
  const s = seed(),
    original = structuredClone(s);
  assert.throws(() => addEntry(s, item('transfer', '30000')), /enough funds/);
  assert.deepEqual(s, original);
});
