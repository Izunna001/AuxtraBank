import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { maskCardNumber } from '../utils/format';
import {
  Eye,
  EyeOff,
  Snowflake,
  Unlock,
  CreditCard,
  Plus,
  Trash2,
  ChevronRight,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';
import type { Card as BankCard } from '../types';
import { WestbridgeLogo } from '../components/ui/WestbridgeLogo';

function revealCvv(card: { cvv?: string; cardNumber: string }) {
  if (card.cvv && /^\d{3,4}$/.test(card.cvv)) return card.cvv;
  const digits = card.cardNumber.replace(/\D/g, '');
  let n = 0;
  for (let i = 0; i < digits.length; i++) n = (n + Number(digits[i]) * (i + 3)) % 900;
  return String(100 + n);
}

function CardVisual({ card, showDetails }: { card: BankCard; showDetails: boolean }) {
  const last4 = card.last4 || card.cardNumber.slice(-4);
  const numberDisplay = showDetails
    ? card.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
    : `•••• •••• •••• ${last4}`;
  const cvvDisplay = showDetails ? revealCvv(card) : '***';

  return (
    <div className="relative aspect-[1.65/1] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-[#1e3a8a] p-5 shadow-2xl shadow-blue-900/50">
      {/* Wave decorations */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -right-8 top-0 w-48 h-48 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="absolute left-10 bottom-0 w-40 h-32 rounded-full bg-white/10 blur-2xl" />
      </div>
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[5.5rem] font-black leading-none select-none pointer-events-none opacity-[0.12] text-white"
        aria-hidden
      >
        W
      </div>

      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <WestbridgeLogo showWordmark={false} size={22} />
            <span className="text-white font-semibold text-sm tracking-tight">
              Auxtra<span className="text-blue-200"> Bank</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-blue-100/80 font-medium">
              {card.type} · {card.status}
            </span>
            <Wifi className="w-4 h-4 text-white/70 rotate-90" />
          </div>
        </div>

        <div>
          <p className="text-white text-xl sm:text-2xl font-mono tracking-[0.2em]">{numberDisplay}</p>
          <div className="flex items-end justify-between mt-4">
            <div className="flex gap-8">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wide">Valid thru</p>
                <p className="text-white font-medium text-sm">
                  {card.expiryMonth}/{card.expiryYear}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wide">CVV</p>
                <p className="text-white font-medium font-mono text-sm tracking-widest">
                  {cvvDisplay}
                </p>
              </div>
            </div>
            {/* Mastercard circles */}
            <div className="flex items-center -space-x-2" aria-hidden>
              <span className="w-7 h-7 rounded-full bg-red-500" />
              <span className="w-7 h-7 rounded-full bg-amber-400" />
            </div>
          </div>
          <p className="text-white/90 text-xs mt-3 tracking-widest uppercase font-medium">
            {card.cardholderName}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Cards() {
  const { cards, freezeCard, addPersonalCard, removeCard } = useAuth();
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });

  const formatCardNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    const name = form.cardholderName.trim();
    const digits = form.cardNumber.replace(/\D/g, '');
    const month = form.expiryMonth.replace(/\D/g, '');
    let year = form.expiryYear.replace(/\D/g, '');
    if (year.length === 4) year = year.slice(-2);
    const cvv = form.cvv.replace(/\D/g, '');

    if (name.length < 2) errs.cardholderName = 'Enter the name on the card';
    else if (!/^[a-zA-Z\s.']{2,60}$/.test(name)) {
      errs.cardholderName = "Only letters, spaces, and . ' - allowed";
    }
    if (!/^\d{13,19}$/.test(digits)) errs.cardNumber = 'Card number must be 13–19 digits';
    else {
      let sum = 0;
      let alt = false;
      for (let i = digits.length - 1; i >= 0; i--) {
        let n = Number(digits[i]);
        if (alt) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
      }
      if (sum % 10 !== 0) errs.cardNumber = 'Invalid card number';
    }
    const m = Number(month);
    if (!month || m < 1 || m > 12) errs.expiryMonth = 'Month 01–12';
    if (year.length < 2) errs.expiryYear = 'Use 2-digit year';
    else if (!errs.expiryMonth) {
      const expEnd = new Date(2000 + Number(year.padStart(2, '0').slice(-2)), m, 0, 23, 59, 59);
      if (expEnd < new Date()) errs.expiryYear = 'Card expired';
    }
    if (!/^\d{3,4}$/.test(cvv)) errs.cvv = 'CVV: 3 or 4 digits';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async () => {
    setError('');
    if (!validateForm()) {
      setError('Please fix the highlighted fields');
      return;
    }
    setLoading(true);
    try {
      await addPersonalCard({
        ...form,
        cardNumber: form.cardNumber.replace(/\D/g, ''),
        cvv: form.cvv.replace(/\D/g, ''),
        expiryMonth: form.expiryMonth.replace(/\D/g, ''),
        expiryYear: form.expiryYear.replace(/\D/g, ''),
      });
      setForm({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: '',
      });
      setFieldErrors({});
      setShowForm(false);
    } catch (e: any) {
      setError(e.message || 'Could not add card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
      {/* Page header row */}
      <div className="rounded-2xl border border-white/5 bg-[#121a28] px-4 py-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white">Cards</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View bank cards and add your personal card details
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
      </div>

      {cards.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#121a28] text-center py-10 px-4">
          <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No cards yet. Add a personal card below.</p>
        </div>
      )}

      {cards.map((card) => (
        <div key={card.id} className="space-y-3">
          <CardVisual card={card} showDetails={!!showDetails[card.id]} />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setShowDetails((prev) => ({ ...prev, [card.id]: !prev[card.id] }))
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#121a28] py-3 text-sm font-medium text-slate-200 hover:border-blue-500/40 transition-colors"
            >
              {showDetails[card.id] ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showDetails[card.id] ? 'Hide details' : 'Show details'}
            </button>
            <button
              type="button"
              onClick={() => freezeCard(card.id)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#121a28] py-3 text-sm font-medium text-slate-200 hover:border-blue-500/40 transition-colors"
            >
              {card.status === 'frozen' ? (
                <>
                  <Unlock className="w-4 h-4" /> Unfreeze
                </>
              ) : (
                <>
                  <Snowflake className="w-4 h-4" /> Freeze
                </>
              )}
            </button>
          </div>
          {card.type === 'physical' && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Remove this personal card?')) return;
                await removeCard(card.id);
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-red-400 py-2"
            >
              <Trash2 className="w-4 h-4" /> Remove personal card
            </button>
          )}
        </div>
      ))}

      {/* Add personal card */}
      <div className="rounded-2xl border border-white/5 bg-[#121a28] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Add personal card</p>
            </div>
          </div>
          <Button size="sm" variant={showForm ? 'ghost' : 'primary'} onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            <span className="ml-1">{showForm ? 'Cancel' : 'Add card'}</span>
          </Button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Store your personal card details for reference. CVV is only shown when you reveal
          details.
        </p>

        {showForm && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <div>
              <Input
                label="Cardholder name"
                value={form.cardholderName}
                onChange={(e) => {
                  setForm({ ...form, cardholderName: e.target.value });
                  setFieldErrors((f) => ({ ...f, cardholderName: '' }));
                }}
                placeholder="NAME ON CARD"
                maxLength={60}
              />
              {fieldErrors.cardholderName && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.cardholderName}</p>
              )}
            </div>
            <div>
              <Input
                label="Card number"
                value={form.cardNumber}
                onChange={(e) => {
                  setForm({ ...form, cardNumber: formatCardNumber(e.target.value) });
                  setFieldErrors((f) => ({ ...f, cardNumber: '' }));
                }}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                maxLength={23}
              />
              {fieldErrors.cardNumber && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.cardNumber}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Input
                  label="Month"
                  value={form.expiryMonth}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    if (v.length === 1 && Number(v) > 1) v = '0' + v;
                    if (Number(v) > 12) v = '12';
                    setForm({ ...form, expiryMonth: v });
                    setFieldErrors((f) => ({ ...f, expiryMonth: '' }));
                  }}
                  placeholder="MM"
                  inputMode="numeric"
                  maxLength={2}
                />
                {fieldErrors.expiryMonth && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.expiryMonth}</p>
                )}
              </div>
              <div>
                <Input
                  label="Year"
                  value={form.expiryYear}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      expiryYear: e.target.value.replace(/\D/g, '').slice(0, 2),
                    });
                    setFieldErrors((f) => ({ ...f, expiryYear: '' }));
                  }}
                  placeholder="YY"
                  inputMode="numeric"
                  maxLength={2}
                />
                {fieldErrors.expiryYear && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.expiryYear}</p>
                )}
              </div>
              <div>
                <Input
                  label="CVV"
                  type="password"
                  value={form.cvv}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                    });
                    setFieldErrors((f) => ({ ...f, cvv: '' }));
                  }}
                  placeholder="***"
                  inputMode="numeric"
                  maxLength={4}
                />
                {fieldErrors.cvv && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.cvv}</p>
                )}
              </div>
            </div>
            <Button onClick={handleAdd} loading={loading} className="w-full">
              Save card
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
