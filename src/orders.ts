export type Status = 'Paid' | 'Pending' | 'Refunded';

export interface Order {
  id: string;
  customer: string;
  status: Status;
  amount: number;
  date: string;
}

export const orders: Order[] = [
  { id: 'OD-1008', customer: 'Aditi Patel', status: 'Paid', amount: 3200, date: '2026-11-10' },
  { id: 'OD-1007', customer: 'Kabir Shah', status: 'Pending', amount: 850, date: '2026-11-10' },
  { id: 'OD-1006', customer: 'Meera Nair', status: 'Paid', amount: 1450, date: '2026-11-09' },
  { id: 'OD-1005', customer: 'Arjun Das', status: 'Refunded', amount: 2100, date: '2026-11-09' },
  { id: 'OD-1004', customer: 'Neha Rao', status: 'Paid', amount: 790, date: '2026-11-08' },
  { id: 'OD-1003', customer: 'Dev Singh', status: 'Pending', amount: 4200, date: '2026-11-08' },
  { id: 'OD-1002', customer: 'Tara Roy', status: 'Paid', amount: 5750, date: '2026-11-07' },
  { id: 'OD-1001', customer: 'Rohan Jain', status: 'Refunded', amount: 980, date: '2026-11-07' },
];

export const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
