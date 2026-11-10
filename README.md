# Novamint dashboard

A responsive React and TypeScript finance dashboard based on the supplied Novamint reference. The home view brings wallet activity, card spending, savings, transfers and monthly budgets together.

## Open the demo

Extract the ZIP first. Open `preview.html` in Chrome or Edge to try the bundled version offline. Open the folder containing `package.json` in VS Code to edit the source.

## Develop locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. Edit the components in `src/`. Run the following commands to test the ledger and produce a production build.

```sh
npm test
npm run build
npm run preview
```

The deployable files are in `dist/`. Navigation uses hash URLs, so subpages work on static hosting. The packaged offline preview is a snapshot of the delivered source.

## Try a complete workflow

1. Start in Home. The initial wallet balance is $25,230.00 and the Visa balance is $1,476.00.
2. Select Alex in Quick transfer, enter 25.00 and confirm. The wallet becomes $25,205.00. Alex is the newest transaction, with a $25.00 debit.
3. Open Cards and top it up with $100.00. The card becomes $1,576.00. The wallet becomes $25,105.00. Internal moves do not count as spending.
4. Freeze the card and try recording a purchase. The form shows a validation message. Unfreeze the card to resume recording purchases.
5. Open Plan. Edit a month's budget using its chart bar. Change the goal target or move wallet funds into the goal or savings account.
6. In Transactions, combine the type, date, account and search filters. Select a row for the transaction details.
7. In Analytics, select a month to see its income, spending and category totals. The Home spending gauge covers this month's card purchases.
8. Refresh the page to confirm that changes persist. Notifications show the five most recent unread entries. Display settings can mask monetary totals.

## Data

All amounts use integer cents in USD. The sample ledger and budgets use dates relative to first launch. Changes are stored in this browser's local storage for the current origin. The offline file and development server have separate data. All contacts, balances and payments are simulated. This app does not connect to a bank, card network, payment processor or authentication service.

## Source guide

| File                 | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| src/App.tsx          | Navigation, dashboard, wallet and card controls         |
| src/Charts.tsx       | Spending gauge, wallet sparkline and interactive budget |
| src/History.tsx      | Transaction history, search and filters                 |
| src/Forms.tsx        | Transfers, payments, budget and profile forms           |
| src/model.ts         | Ledger, sample data and accounting rules                |
| src/store.ts         | Persistence and cross-tab updates                       |
| src/ui.tsx           | Shared dialog, money, avatar and merchant components    |
| src/style.css        | Desktop, tablet and mobile layouts                      |
| tests/model.test.mjs | Accounting and validation tests                         |

## Use in the existing order-dashboard repository

Start from a clean working tree in your clone. Create a feature branch with `git switch -c feature/finance-dashboard`. Copy this project's `src/`, `tests/`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `.gitignore` and `README.md` into the clone, replacing matching files. The previous starter's unused `src/orders.ts` can be removed on this branch. Run the install, test and build commands above before committing.

## Credits

Manrope is distributed under the SIL Open Font License. Lucide icons are distributed under the ISC and MIT licenses. React, React DOM and Scheduler use the MIT license. License texts for bundled libraries are included in `licenses/`. Avatar thumbnails come from the supplied visual reference.
