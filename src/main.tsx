import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { money, orders, type Status } from './orders';
import './style.css';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

function App() {
  const [status, setStatus] = useState<Status | 'All'>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'none' | 'ascending' | 'descending'>('none');
  const needle = query.trim().toLowerCase();
  const visible = orders.filter(order =>
    (status === 'All' || order.status === status) &&
    (order.id.toLowerCase().includes(needle) || order.customer.toLowerCase().includes(needle))
  );
  if (sort !== 'none') {
    visible.sort((a, b) => sort === 'ascending' ? a.amount - b.amount : b.amount - a.amount);
  }
  return (
    <>
      <header><div className="brand"><span className="logomark" aria-hidden="true">≡</span>Order desk</div></header>
      <main>
        <h1>Orders</h1>
        <section aria-label="Order filters" className="toolbar">
          <label>Search orders<input type="search" placeholder="Customer or order ID" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <label>Payment status<select value={status} onChange={e => setStatus(e.target.value as Status | 'All')}>
            <option value="All">All statuses</option>
            <option>Paid</option><option>Pending</option><option>Refunded</option>
          </select></label>
        </section>
        <div className="table-shell">
          <table aria-label="Orders">
            <thead><tr>
              <th scope="col">Order ID</th><th scope="col">Customer</th><th scope="col">Date</th><th scope="col">Status</th>
              <th scope="col" className="amount" aria-sort={sort}><button onClick={() => setSort(sort === 'ascending' ? 'descending' : 'ascending')}>Amount <span aria-hidden="true">{sort === 'ascending' ? '↑' : sort === 'descending' ? '↓' : '↕'}</span></button></th>
            </tr></thead>
            <tbody>
              {visible.map(order => <tr key={order.id}>
                <th scope="row" className="order-id">{order.id}</th><td>{order.customer}</td>
                <td><time dateTime={order.date}>{dateFormat.format(new Date(order.date))}</time></td>
                <td><span className={'status ' + order.status.toLowerCase()}>{order.status}</span></td>
                <td className="amount">{money.format(order.amount)}</td>
              </tr>)}
              {visible.length === 0 && <tr><td colSpan={5} className="empty">No matching orders. <button onClick={() => { setQuery(''); setStatus('All'); }}>Clear filters</button></td></tr>}
            </tbody>
          </table>
        </div>
        <p className="count" role="status">{visible.length} of {orders.length} orders</p>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
