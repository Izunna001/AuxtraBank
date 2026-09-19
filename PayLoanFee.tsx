import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import {
  CreditCard,
  Building2,
  ExternalLink,
  Copy,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export default function PayLoanFee() {
  const {
    getPendingLoanFee,
    paymentSettings,
    submitLoanFeePayment,
    account,
    loans,
  } = useAuth();
  const pending = getPendingLoanFee();
  const navigate = useNavigate();
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState('');

  const loan = pending ? loans.find((l) => l.id === pending.loanId) : null;
  const settings = paymentSettings;

  const copyText = async (label: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async () => {
    if (!pending) return;
    setError('');
    setLoading(true);
    try {
      await submitLoanFeePayment(pending.loanId, reference);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (!pending) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in space-y-4">
        <Card className="text-center py-10">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">No fee due</h2>
          <p className="text-gray-400 text-sm mt-2">You do not have a pending loan fee.</p>
          <Button className="mt-6" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (success || loan?.feePaymentPending) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in space-y-4">
        <Card className="text-center py-10 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-blue-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Payment submitted</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Your payment reference is under review. An administrator will confirm your 10% loan fee
            shortly. You will be notified when funds are unlocked.
          </p>
          {loan?.feePaymentRef && (
            <p className="text-sm text-gray-500">
              Reference: <span className="font-mono text-white">{loan.feePaymentRef}</span>
            </p>
          )}
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Pay loan processing fee</h1>
        <p className="text-gray-400 text-sm mt-1">
          Complete the 10% fee via PayPal or card using the details below
        </p>
      </div>

      <Card className="bg-gradient-to-br from-blue-600/20 to-indigo-700/10 border-blue-500/30">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Loan amount</p>
            <p className="text-xl font-bold text-white">{formatCurrency(pending.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Fee due (10%)</p>
            <p className="text-xl font-bold text-amber-400">{formatCurrency(pending.fee)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Your balance</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(account?.availableBalance ?? 0)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">PayPal & card payment</h3>
        </div>
        <p className="text-sm text-gray-400">
          Send exactly <strong className="text-white">{formatCurrency(pending.fee)}</strong> using
          one of the methods configured by Auxtra Bank administration.
        </p>

        {settings?.paypalEmail && (
          <div className="rounded-xl border border-navy-600 bg-navy-950/50 p-4">
            <p className="text-xs text-gray-500 mb-1">PayPal email</p>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-white text-sm break-all">{settings.paypalEmail}</p>
              <button
                type="button"
                onClick={() => copyText('email', settings.paypalEmail)}
                className="text-blue-400 hover:text-blue-300 shrink-0"
              >
                {copied === 'email' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {settings?.paypalLink && (
          <a
            href={settings.paypalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-xl border border-blue-500/40 bg-blue-600/10 px-4 py-3 text-blue-400 hover:bg-blue-600/20 transition-colors"
          >
            <span className="text-sm font-medium">Open PayPal payment link</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {settings?.cardInstructions && (
          <div className="rounded-xl border border-navy-600 bg-navy-950/50 p-4">
            <p className="text-xs text-gray-500 mb-2">Card payment instructions</p>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{settings.cardInstructions}</p>
          </div>
        )}

        {(settings?.bankAccountNumber || settings?.bankName) && (
          <div className="rounded-xl border border-navy-600 bg-navy-950/50 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Bank transfer details</p>
            </div>
            {settings.bankName && (
              <p className="text-sm text-gray-300">
                Bank: <span className="text-white">{settings.bankName}</span>
              </p>
            )}
            {settings.bankAccountName && (
              <p className="text-sm text-gray-300">
                Name: <span className="text-white">{settings.bankAccountName}</span>
              </p>
            )}
            {settings.bankAccountNumber && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-mono text-white">{settings.bankAccountNumber}</p>
                <button
                  type="button"
                  onClick={() => copyText('acct', settings.bankAccountNumber)}
                  className="text-blue-400"
                >
                  {copied === 'acct' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        )}

        {settings?.additionalNotes && (
          <p className="text-xs text-gray-500 whitespace-pre-wrap">{settings.additionalNotes}</p>
        )}

        {!settings?.paypalEmail && !settings?.paypalLink && !settings?.cardInstructions && (
          <p className="text-sm text-amber-400">
            Payment details have not been configured by admin yet. Please contact support or try
            again later.
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <h3 className="font-semibold text-white">Confirm your payment</h3>
        <p className="text-sm text-gray-400">
          After paying, enter the PayPal transaction ID, card receipt number, or reference so an
          administrator can verify and unlock your loan funds.
        </p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <Input
          label="Payment reference / Transaction ID"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. PAYPAL-1AB2CD3EF"
        />
        <Button className="w-full" size="lg" loading={loading} onClick={handleSubmit}>
          Submit payment reference
        </Button>
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            Never share your banking password. Only send the fee to official Auxtra Bank payment
            details shown above.
          </span>
        </div>
      </Card>
    </div>
  );
}
