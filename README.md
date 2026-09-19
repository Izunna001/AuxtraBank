# NovaBank — Modern Digital Banking Platform

A premium, fully interactive digital banking web application inspired by modern fintech dashboards (dark navy theme, blue accents, responsive mobile layout).

## Features

- **Authentication**: Sign up, Login, Logout, protected routes (demo mode with localStorage; ready for Firebase Auth)
- **Dashboard**: Balance cards, recent transactions, savings promo, income/expense summary — matches the visual direction of the reference design
- **Accounts**: View balance, account number (copyable), type, status
- **Transfers**: Multi-step flow (form → confirmation → PIN → success) with simulated transactions and fee
- **Transactions**: List, search, filter (credit/debit), detailed receipt view with print support
- **Cards**: Virtual card UI, show/hide details, freeze/unfreeze
- **Payments**: Airtime, Data, Electricity, TV, Internet (simulated, creates transaction records)
- **Savings**: Create goals, progress bars, add funds
- **Loans**: Calculator + application (demo)
- **Notifications**: Unread/read, mark all as read
- **Settings / Profile**: Edit name & phone, logout
- **Admin Panel**: Role-based (login as `admin@novabank.com` / `admin123`)
- **Responsive**: Desktop sidebar + mobile bottom nav + drawer menu
- **UI**: Dark navy, blue accents, rounded cards, subtle animations, Inter font

## Quick Start

```bash
cd swiftbank
npm install
npm run dev
```

Open http://localhost:5173

### Demo Credentials

- Any email + password (min 6 characters) creates a new user session
- Admin: `admin@novabank.com` / `admin123`

Data is persisted in `localStorage` under the key `swiftbank_demo_data`.

## Switching to Real Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication → Email/Password**
3. Create a **Firestore** database
4. Copy your web config into `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Replace the demo logic in `src/context/AuthContext.tsx` with real Firebase Auth + Firestore calls (the structure and types are already prepared).
6. Deploy Firestore security rules that enforce `request.auth.uid` ownership and role checks for admin collections.

**Never commit real API keys or service-account JSON.**

## Project Structure

```
src/
  components/
    layout/     Sidebar, Header, MobileNav, AppLayout
    ui/         Button, Card, Input
  context/      AuthContext (demo + Firebase-ready)
  lib/          firebase.ts
  pages/        Dashboard, Transfers, Transactions, ...
  types/        Shared TypeScript interfaces
  utils/        format, cn
```

## Important Notes

- All money movement is **simulated**. The UI clearly states this where relevant.
- Card CVV / real PINs are never stored in plaintext.
- This is a frontend demonstration platform suitable for portfolio / learning. Production banking requires licensed partners, PCI compliance, and proper backend services.

## License

MIT — free to use and modify.
