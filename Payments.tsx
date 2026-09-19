import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  Globe,
  CreditCard,
  Building2,
  Droplets,
  Plane,
} from 'lucide-react';

const categories = [
  {
    id: 'mobile',
    label: 'Mobile',
    icon: Smartphone,
    providers: [
      'AT&T',
      'Verizon',
      'T-Mobile',
      'Vodafone',
      'Orange',
      'MTN',
      'Airtel',
      'EE',
      'Telstra',
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: Wifi,
    providers: ['AT&T', 'Verizon', 'Vodafone', 'MTN', 'Airtel', 'EE', 'Optus'],
  },
  {
    id: 'electricity',
    label: 'Electricity',
    icon: Zap,
    providers: [
      'Con Edison',
      'Pacific Gas',
      'E.ON',
      'EDF Energy',
      'Iberdrola',
      'IKEDC',
      'AES',
    ],
  },
  {
    id: 'water',
    label: 'Water',
    icon: Droplets,
    providers: ['American Water', 'Thames Water', 'Veolia', 'Suez'],
  },
  {
    id: 'tv',
    label: 'TV / Stream',
    icon: Tv,
    providers: ['Netflix', 'Disney+', 'Sky', 'DStv', 'Hulu', 'Amazon Prime'],
  },
  {
    id: 'internet',
    label: 'Internet',
    icon: Globe,
    providers: ['Comcast', 'BT', 'Orange Fiber', 'Deutsche Telekom', 'Spectrum'],
  },
  {
    id: 'card',
    label: 'Card Bill',
    icon: CreditCard,
    providers: ['Visa', 'Mastercard', 'Amex', 'Discover'],
  },
  {
    id: 'bank',
    label: 'Bank / Wire',
    icon: Building2,
    providers: ['SWIFT Transfer', 'SEPA', 'ACH', 'Wire USD', 'Wire EUR'],
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: Plane,
    providers: ['Airline Ticket', 'Hotel', 'Uber', 'Booking.com'],
  },
];

export default function Payments() {
  const { makePayment, account, needsLoanFee, getPendingLoanFee, getAdminAccountNumber } =
    useAuth();
  const [selected, setSelected] = useState(categories[0]);
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const loanBlocked = needsLoanFee();
  const pendingLoan = getPendingLoanFee();
  const adminAcct = getAdminAccountNumber();

  const handlePay = async () => {
    setError('');
    setSuccess(false);
    if (loanBlocked && pendingLoan) {
      setError(
        `Pay the 10% loan fee (${pendingLoan.fee}) to admin account ${adminAcct || ''} first.`
      );
      return;
    }
    const amt = parseFloat(amount);
    if (!provider || !amt || amt <= 0) {
      setError('Select a provider and enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      await makePayment({
        type: selected.id,
        provider,
        amount: amt,
        phoneOrAccount: reference,
      });
      setSuccess(true);
      setAmount('');
      setReference('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments & Bills</h1>
        <p className="text-gray-400 text-sm mt-1">
          International bill pay · Mobile, utilities, streaming, wire & travel
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setSelected(c);
              setProvider('');
              setSuccess(false);
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              selected.id === c.id
                ? 'bg-blue-600/15 border-blue-500/40 text-blue-400'
                : 'bg-navy-800 border-navy-700 text-gray-400 hover:border-navy-600'
            }`}
          >
            <c.icon className="w-5 h-5" />
            <span className="text-xs font-medium text-center leading-tight">{c.label}</span>
          </button>
        ))}
      </div>

      <Card className="space-y-4">
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            Payment successful
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full bg-navy-900/80 border border-navy-600 rounded-xl px-4 py-2.5 text-gray-100"
          >
            <option value="">Select provider</option>
            {selected.providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Account / Phone / Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Number or customer ID"
        />
        <Input
          label="Amount ($)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
        <p className="text-xs text-gray-500">
          Available: {formatCurrency(account?.availableBalance ?? 0)}
        </p>
        <Button
          onClick={handlePay}
          className="w-full"
          size="lg"
          loading={loading}
          disabled={loanBlocked}
        >
          Pay Now
        </Button>
        <p className="text-xs text-gray-500 text-center">
          Simulated international payment — balance updates instantly
        </p>
      </Card>
    </div>
  );
}
