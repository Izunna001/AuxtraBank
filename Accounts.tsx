import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatAccountNumber } from '../utils/format';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Wallet,
  User,
  Coins,
  FileText,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function Accounts() {
  const { account, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const copy = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!account) {
    return <p className="text-gray-400 text-center py-12">No account found</p>;
  }

  const typeLabel =
    account.accountType === 'current'
      ? 'Current Account'
      : account.accountType === 'fixed'
        ? 'Fixed Account'
        : 'Savings Account';

  const isFrozen = account.status === 'frozen' || user?.accountFrozen;
  const isActive = account.status === 'active' && !isFrozen;

  return (
    <div className="animate-fade-in max-w-lg mx-auto w-full min-w-0 space-y-4">
      {/* Title */}
      <div className="relative overflow-hidden rounded-2xl px-1 pt-1 pb-2">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              'radial-gradient(ellipse 90% 80% at 100% -20%, rgba(37,99,235,0.4), transparent 55%)',
          }}
        />
        <div className="relative">
          <h1 className="text-2xl font-bold text-white tracking-tight">Accounts</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your bank accounts</p>
        </div>
      </div>

      {/* Account card */}
      <div className="rounded-2xl overflow-hidden border border-blue-500/20 bg-[#0c1424] shadow-xl shadow-blue-950/30">
        {/* Balance header — amount cannot push eye icon */}
        <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 px-4 py-5 sm:px-5">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-blue-100 text-sm font-medium mb-2">
                <Wallet className="w-4 h-4 shrink-0" />
                <span className="truncate">{typeLabel}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate tabular-nums">
                {show ? formatCurrency(account.balance) : '**********'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="shrink-0 p-2 rounded-xl text-blue-100/90 hover:text-white hover:bg-white/10"
              aria-label="Toggle balance"
            >
              {show ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.06] px-4">
          <Row
            icon={<CreditCard className="w-4 h-4 text-blue-400/90" />}
            label="Account Number"
            right={
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-sm text-white tracking-wide truncate">
                  {formatAccountNumber(account.accountNumber)}
                </span>
                <button
                  type="button"
                  onClick={copy}
                  className="shrink-0 p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            }
          />
          <Row
            icon={<User className="w-4 h-4 text-blue-400/90" />}
            label="Account Name"
            right={
              <span className="text-sm text-white font-medium truncate max-w-[9rem] sm:max-w-[12rem] text-right">
                {user?.fullName || '—'}
              </span>
            }
          />
          <Row
            icon={<Coins className="w-4 h-4 text-blue-400/90" />}
            label="Available Balance"
            right={
              <span className="text-sm text-white font-semibold tabular-nums">
                {show ? formatCurrency(account.availableBalance) : '**********'}
              </span>
            }
          />
          <Row
            icon={
              <span
                className={`w-2 h-2 rounded-full ${
                  isFrozen ? 'bg-red-400' : isActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            }
            label="Status"
            right={
              <span
                className={`text-sm font-semibold ${
                  isFrozen ? 'text-red-400' : isActive ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isFrozen ? 'Frozen' : account.status}
              </span>
            }
          />
        </div>
      </div>

      {/* Details */}
      <button
        type="button"
        onClick={() => setDetailsOpen(!detailsOpen)}
        className="w-full rounded-2xl border border-white/5 bg-[#121a28] px-4 py-4 flex items-center gap-3 text-left hover:border-blue-500/25 transition-colors"
      >
        <div className="w-11 h-11 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">Account Details</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            Currency: {account.currency || 'USD'}
            {account.createdAt
              ? ` · Created: ${format(new Date(account.createdAt), 'M/d/yyyy')}`
              : ''}
          </p>
          {detailsOpen && (
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              <p>
                Type: <span className="text-slate-200 capitalize">{account.accountType}</span>
              </p>
            </div>
          )}
        </div>
        <ChevronRight
          className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${
            detailsOpen ? 'rotate-90' : ''
          }`}
        />
      </button>
    </div>
  );
}

function Row({
  icon,
  label,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 gap-3 min-w-0">
      <div className="flex items-center gap-3 text-slate-400 text-sm shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0 flex justify-end">{right}</div>
    </div>
  );
}
