import { useAuth } from '../context/AuthContext';
import { formatCurrency, getGreeting } from '../utils/format';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Eye,
  EyeOff,
  TrendingUp,
  Send,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

/** Hero backdrop — modern architecture / fintech mood */
const HERO_BG =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';

export default function Dashboard() {
  const {
    user,
    account,
    transactions,
    savingsGoals,
    loans,
    isAccountFrozen,
  } = useAuth();
  const [showBalance, setShowBalance] = useState(true);

  const recent = transactions.slice(0, 5);
  const totalSavings = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalLoans = loans
    .filter((l) => l.status === 'approved' || l.status === 'repaying')
    .reduce((s, l) => s + l.amount, 0);
  const last4 = account?.accountNumber?.slice(-4) || '----';
  const firstName = user?.fullName?.split(' ')[0] || 'User';

  return (
    <div className="animate-fade-in max-w-lg mx-auto lg:max-w-xl -mt-2">
      {/* ── Hero: background image + greeting + balance ── */}
      <div className="relative overflow-hidden rounded-b-[1.75rem] sm:rounded-3xl mb-4">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          aria-hidden
        />
        {/* Dark blue overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/95 via-[#0c1a2e]/88 to-[#0a0e17]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/70 to-transparent" />
        {/* Soft W watermark */}
        <div
          className="absolute -right-6 top-8 text-[7rem] font-black leading-none select-none pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(37,99,235,0.05))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          aria-hidden
        >
          W
        </div>

        <div className="relative px-4 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-7 space-y-5">
          {/* Greeting */}
          <div>
            <p className="text-sm text-blue-200/80 font-medium">{getGreeting()},</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
              {firstName}
            </h1>
            <p className="text-sm text-slate-400 mt-1">Build a better financial future.</p>
          </div>

          {isAccountFrozen() && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2.5">
              <p className="text-xs text-red-200">
                Account frozen — transfers and payments are disabled.
              </p>
            </div>
          )}
{/* Total Balance card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 p-4 sm:p-5 shadow-xl shadow-blue-900/40">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full bg-cyan-400/10 blur-xl" />
            <div className="relative flex items-start gap-3">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-blue-100 text-sm font-medium">Total Balance</p>
                  <button
                    type="button"
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-blue-100/90 hover:text-white p-0.5 shrink-0"
                    aria-label="Toggle balance"
                  >
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight truncate tabular-nums">
                  {showBalance ? formatCurrency(account?.availableBalance ?? 0) : '**********'}
                </p>
                <p className="text-blue-200/70 text-xs mt-2 sm:mt-3 font-mono tracking-[0.35em]">
                  •••• {last4}
                </p>
              </div>
              {/* Mastercard-style mark — fixed, never pushed */}
              <div className="flex items-center -space-x-2.5 mt-1 shrink-0" aria-hidden>
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500/90" />
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400/90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-0 space-y-4">
        {/* Savings + Loans */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/savings"
            className="rounded-2xl bg-[#121a28] border border-white/5 p-4 hover:border-blue-500/30 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">Savings</p>
            <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(totalSavings)}</p>
          </Link>
          <Link
            to="/loans"
            className="rounded-2xl bg-[#121a28] border border-white/5 p-4 hover:border-blue-500/30 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">Active Loans</p>
            <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(totalLoans)}</p>
          </Link>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/transfers">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 transition-colors shadow-lg shadow-blue-600/25"
            >
              <Send className="w-4 h-4" />
              Transfer
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </Link>
          <Link to="/payments">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#121a28] border border-white/10 text-blue-300 font-semibold py-3.5 hover:border-blue-500/40 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              Pay Bills
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </Link>
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl bg-[#121a28] border border-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Transactions</h3>
            <Link
              to="/transactions"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-1">
              {recent.map((tx) => (
                <Link
                  key={tx.id}
                  to={`/transactions/${tx.id}`}
                  className="flex items-center gap-3 py-2.5 px-1 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'credit'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate uppercase">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(tx.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold shrink-0 ${
                      tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
