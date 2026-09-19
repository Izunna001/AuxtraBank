import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import { LoanFeeNotice } from '../components/ui/LoanFeeNotice';
import { HandCoins, Calendar, FileText, Info, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Loans() {
  const {
    applyLoan,
    loans,
    needsLoanFee,
    getPendingLoanFee,
    getAdminAccountNumber,
    account,
  } = useAuth();
  const [amount, setAmount] = useState('10000');
  const [months, setMonths] = useState(12);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const amt = parseFloat(amount) || 0;
  const rate = 12;
  const monthlyRate = rate / 100 / 12;
  const monthly =
    amt > 0
      ? Math.round(
          ((amt * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1)) *
            100
        ) / 100
      : 0;

  const pendingLoan = getPendingLoanFee();
  const adminAcct = getAdminAccountNumber();
  const feePreview = Math.ceil(amt * 0.1 * 100) / 100;

  const fieldClass =
    'w-full bg-navy-900/60 border border-navy-600 rounded-xl px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40';

  const handleApply = async () => {
    setError('');
    setSuccess('');
    if (amt < 10000) {
      setError('Minimum loan is $10,000');
      return;
    }
    setLoading(true);
    try {
      await applyLoan({ amount: amt, periodMonths: months, purpose });
      setSuccess('Loan application submitted. Wait for admin approval.');
      setAmount('10000');
      setPurpose('');
    } catch (e: any) {
      setError(e.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
      {/* Hero like reference */}
      <div className="rounded-2xl bg-blue-600/10 border border-blue-500/20 px-4 py-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
          <HandCoins className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Loans</h1>
          <p className="text-sm text-blue-200/80 mt-0.5">
            Apply from $10,000 · After approval, pay 10% fee to admin account before use.
          </p>
        </div>
      </div>

      {needsLoanFee() && pendingLoan && (
        <LoanFeeNotice
          loanAmount={pendingLoan.amount}
          feeAmount={pendingLoan.fee}
          adminAccountNumber={adminAcct}
          availableBalance={account?.availableBalance}
        />
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3">
          {success}
        </div>
      )}

      {/* Calculator & Application */}
      <div className="rounded-2xl border border-navy-700 bg-navy-900/60 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Loan Calculator & Application</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Quick, simple and secure loan application process.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1.5">
            <span className="w-7 h-7 rounded-lg bg-blue-600/15 flex items-center justify-center">
              <HandCoins className="w-3.5 h-3.5 text-blue-400" />
            </span>
            Amount ($)
          </label>
          <div className="relative">
            <input
              type="number"
              min={10000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={fieldClass + ' pr-10'}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              $
            </span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1.5">
            <span className="w-7 h-7 rounded-lg bg-blue-600/15 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
            </span>
            Repayment Period
          </label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className={fieldClass}
          >
            {[6, 12, 18, 24, 36, 48].map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1.5">
            <span className="w-7 h-7 rounded-lg bg-blue-600/15 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            </span>
            Purpose (optional)
          </label>
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Business, education..."
            className={fieldClass}
          />
        </div>

        {amt >= 10000 && (
          <div className="rounded-xl bg-navy-950/50 border border-navy-700 px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Est. monthly</span>
              <span className="text-white font-medium">{formatCurrency(monthly)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">10% fee after approval</span>
              <span className="text-amber-400 font-medium">{formatCurrency(feePreview)}</span>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-blue-600/10 border border-blue-500/20 px-4 py-3 flex gap-2 text-sm text-blue-200/90">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-blue-300">Minimum $10,000.</strong> After admin approves and
            funds your account, you must pay 10% of the loan to the admin account before using the
            money.
          </p>
        </div>

        <Button onClick={handleApply} loading={loading} className="w-full" size="lg">
          Submit Application →
        </Button>
      </div>

      {/* Applications list */}
      <div className="rounded-2xl border border-navy-700 bg-navy-900/60 p-5 space-y-3">
        <h3 className="font-semibold text-white">Your applications</h3>
        {loans.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No loan applications yet</p>
        ) : (
          loans.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-3 border border-navy-700 rounded-xl p-3"
            >
              <div>
                <p className="text-white font-medium">{formatCurrency(l.amount)}</p>
                <p className="text-xs text-gray-500">
                  {l.periodMonths} mo · {format(new Date(l.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                  l.status === 'approved' || l.status === 'repaying'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : l.status === 'pending'
                      ? 'bg-amber-500/15 text-amber-400'
                      : l.status === 'rejected'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-navy-700 text-gray-400'
                }`}
              >
                {l.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
