import { HandCoins, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { formatCurrency } from '../../utils/format';

interface LoanFeeNoticeProps {
  loanAmount: number;
  feeAmount: number;
  adminAccountNumber?: string | null;
  availableBalance?: number;
  loading?: boolean;
  onPay?: () => void;
  compact?: boolean;
}

export function LoanFeeNotice({
  loanAmount,
  feeAmount,
  adminAccountNumber,
  availableBalance,
  compact = false,
}: LoanFeeNoticeProps) {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 shadow-lg shadow-amber-900/10">
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className={`relative ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <HandCoins className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Loan processing fee due
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Required
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your loan of{' '}
              <span className="text-white font-medium">{formatCurrency(loanAmount)}</span> was
              approved. Pay the{' '}
              <span className="text-amber-300 font-medium">10% processing fee</span> via PayPal or
              card before transfers and withdrawals are unlocked.
            </p>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-navy-950/60 border border-navy-700/80 p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Fee amount</p>
            <p className="text-lg font-bold text-amber-400">{formatCurrency(feeAmount)}</p>
            <p className="text-xs text-gray-500 mt-0.5">10% of loan</p>
          </div>
          <div className="rounded-xl bg-navy-950/60 border border-navy-700/80 p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Payment method
            </p>
            <p className="text-sm font-semibold text-white">PayPal / Card</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {adminAccountNumber ? `Acct ${adminAccountNumber}` : 'Admin configured'}
            </p>
          </div>
          <div className="rounded-xl bg-navy-950/60 border border-navy-700/80 p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Your balance</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(availableBalance ?? 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Available funds</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button size="lg" className="sm:min-w-[220px]" onClick={() => navigate('/pay-loan-fee')}>
            Pay fee via PayPal / Card
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              You will see official PayPal and card details set by the bank administrator.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
