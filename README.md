# React Order Dashboard

A React and TypeScript starter for browsing eight fictional orders. Search by customer or order ID, filter by payment status and sort by amount in Indian rupees. All controls work with a keyboard.

## Run locally

With Node.js 22.12 or newer installed, open a terminal in this directory.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To type-check and build the app, run `npm run build`.

## Verify the interactions

1. On initial load, the table contains eight orders and begins with OD-1008.
2. Select **Paid**. Exactly four rows remain.
3. Click **Amount** once. The paid orders appear in this order: OD-1004 (₹790), OD-1006 (₹1,450), OD-1008 (₹3,200), OD-1002 (₹5,750). Click again to reverse the order.
4. With **Paid** selected, enter `meera` in the search field. Only OD-1006 remains.
5. Search for `missing`. The empty state appears. Click **Clear filters** to see all eight orders again.
