import { useEffect, useState } from 'react';
import { seed, type State } from './model';

const key = 'novamint.dashboard.v1';
function read(): State | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  const s = JSON.parse(raw);
  if (
    s.version !== 1 ||
    !Array.isArray(s.entries) ||
    !Array.isArray(s.contacts) ||
    !Array.isArray(s.budgets)
  ) {
    throw new Error('This saved dashboard could not be opened.');
  }
  return s as State;
}
export function useDashboard() {
  const [state, setState] = useState<State>(() => read() ?? seed());
  useEffect(() => {
    if (!localStorage.getItem(key))
      localStorage.setItem(key, JSON.stringify(state));
    const sync = (event: StorageEvent) => {
      if (event.key === key) setState(read() ?? seed());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [state]);
  async function update(change: (draft: State) => void) {
    const commit = () => {
      const next = read() ?? structuredClone(state);
      change(next);
      localStorage.setItem(key, JSON.stringify(next));
      setState(next);
    };
    if (navigator.locks) await navigator.locks.request(key, commit);
    else commit();
  }
  return { state, update };
}
