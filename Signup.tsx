import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WestbridgeLogo } from '../components/ui/WestbridgeLogo';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

const HERO_BG =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80';

const COUNTRY_CODES = [
  { code: '+1', country: 'US', label: 'US +1', min: 10, max: 10 },
  { code: '+44', country: 'UK', label: 'UK +44', min: 10, max: 10 },
  { code: '+49', country: 'DE', label: 'DE +49', min: 10, max: 11 },
  { code: '+33', country: 'FR', label: 'FR +33', min: 9, max: 9 },
  { code: '+234', country: 'NG', label: 'NG +234', min: 10, max: 10 },
  { code: '+254', country: 'KE', label: 'KE +254', min: 9, max: 10 },
  { code: '+27', country: 'ZA', label: 'ZA +27', min: 9, max: 9 },
  { code: '+91', country: 'IN', label: 'IN +91', min: 10, max: 10 },
  { code: '+86', country: 'CN', label: 'CN +86', min: 11, max: 11 },
  { code: '+81', country: 'JP', label: 'JP +81', min: 10, max: 11 },
  { code: '+61', country: 'AU', label: 'AU +61', min: 9, max: 9 },
  { code: '+971', country: 'AE', label: 'AE +971', min: 9, max: 9 },
  { code: '+55', country: 'BR', label: 'BR +55', min: 10, max: 11 },
  { code: '+52', country: 'MX', label: 'MX +52', min: 10, max: 10 },
  { code: '+34', country: 'ES', label: 'ES +34', min: 9, max: 9 },
  { code: '+39', country: 'IT', label: 'IT +39', min: 9, max: 10 },
  { code: '+31', country: 'NL', label: 'NL +31', min: 9, max: 9 },
  { code: '+46', country: 'SE', label: 'SE +46', min: 9, max: 10 },
  { code: '+65', country: 'SG', label: 'SG +65', min: 8, max: 8 },
  { code: '+233', country: 'GH', label: 'GH +233', min: 9, max: 9 },
];

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const selected = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];
  const digits = phone.replace(/\D/g, '');
  const phoneComplete = digits.length >= selected.min && digits.length <= selected.max;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreed) {
      setError('You must agree to the Terms & Conditions');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required');
      return;
    }
    if (!phoneComplete) {
      setError(
        `Phone incomplete. ${selected.country} needs ${selected.min}${
          selected.min !== selected.max ? `–${selected.max}` : ''
        } digits.`
      );
      return;
    }
    setLoading(true);
    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: `${countryCode}${digits}`,
        dateOfBirth,
        password,
      });
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] relative overflow-x-hidden">
      {/* Full-page background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#06101c]/92 via-[#0a1628]/94 to-[#06101c]/98" />
      <div className="fixed inset-0 bg-gradient-to-r from-[#06101c]/70 via-transparent to-[#06101c]/40" />

      <div className="relative z-10 mx-auto w-full max-w-[420px] min-h-[100dvh] flex flex-col px-5 pb-8">
        {/* Top bar */}
        <div
          className="flex items-start justify-between gap-3 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4"
        >
          <div>
            <WestbridgeLogo size={28} />
            <p className="text-[10px] text-slate-400 mt-1 tracking-wide">
              Your Goals. Our Priority.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-blue-100/95 bg-blue-500/15 border border-blue-400/30 rounded-full px-3 py-1.5 mt-0.5">
            <Shield className="w-3 h-3 text-blue-300" />
            Secure &amp; Encrypted
          </span>
        </div>

        {/* Back */}
        <Link
          to="/login"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/15 transition-colors mb-5"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Title */}
        <h1 className="text-[1.85rem] font-bold text-white leading-[1.15] tracking-tight">
          Create Your
          <br />
          <span className="text-blue-400">Account</span>
        </h1>
        <p className="mt-2.5 text-[13px] text-slate-300/90 leading-relaxed max-w-[260px] mb-6">
          Join Auxtra Bank today and take control of your financial future.
        </p>

        {/* Dark glass form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.35rem] border border-blue-500/25 bg-[#0c1a30]/75 backdrop-blur-xl p-5 space-y-4 shadow-2xl shadow-black/40"
        >
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] px-3.5 py-2.5">
              {error}
            </div>
          )}

          <DarkField icon={<User className="w-4 h-4" />} label="First Name *">
            <input
              className="dark-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              required
              autoComplete="given-name"
            />
          </DarkField>

          <DarkField icon={<User className="w-4 h-4" />} label="Last Name *">
            <input
              className="dark-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              required
              autoComplete="family-name"
            />
          </DarkField>

          <DarkField icon={<Mail className="w-4 h-4" />} label="Email Address *">
            <input
              className="dark-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              autoComplete="email"
            />
          </DarkField>

          <DarkField icon={<Phone className="w-4 h-4" />} label="Phone Number *">
            <div
              className={`flex items-stretch rounded-xl border overflow-hidden transition-all ${
                digits.length > 0 && !phoneComplete
                  ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                  : phoneComplete
                    ? 'border-emerald-500/35 ring-1 ring-emerald-500/15'
                    : 'border-blue-500/28 focus-within:border-blue-400/60 focus-within:ring-2 focus-within:ring-blue-500/20'
              } bg-[#081224]/90`}
            >
              <div className="relative shrink-0 border-r border-blue-500/20 bg-blue-500/5">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-full appearance-none bg-transparent text-slate-100 text-[13px] font-medium pl-3 pr-8 py-3.5 focus:outline-none cursor-pointer min-w-[6.75rem]"
                  aria-label="Country code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0c1a30] text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, selected.max);
                  let formatted = raw;
                  if (raw.length > 6) {
                    formatted = raw.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
                  } else if (raw.length > 3) {
                    formatted = raw.replace(/(\d{3})(\d+)/, '$1 $2');
                  }
                  setPhone(formatted);
                }}
                placeholder="000 000 0000"
                required
                inputMode="numeric"
                autoComplete="tel-national"
                className="flex-1 min-w-0 bg-transparent px-3.5 py-3.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <div className="mt-2 flex items-start justify-between gap-2">
              {phoneComplete ? (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Number looks complete · {selected.country} {countryCode}
                </p>
              ) : digits.length > 0 ? (
                <p className="text-[11px] text-amber-400/90">
                  {digits.length}/{selected.min}
                  {selected.min !== selected.max ? `–${selected.max}` : ''} digits for {selected.country}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Select your country, then enter your mobile number
                </p>
              )}
              {digits.length > 0 && (
                <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                  {digits.length} digit{digits.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </DarkField>

          <DarkField icon={<Calendar className="w-4 h-4" />} label="Date of Birth *">
            <input
              className="dark-input"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              max={new Date().toISOString().slice(0, 10)}
            />
          </DarkField>

          <DarkField icon={<Lock className="w-4 h-4" />} label="Password *">
            <div className="relative">
              <input
                className="dark-input pr-11"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </DarkField>

          <DarkField icon={<Lock className="w-4 h-4" />} label="Confirm Password *">
            <div className="relative">
              <input
                className="dark-input pr-11"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </DarkField>

          <label className="flex items-start gap-2.5 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-blue-500/40 bg-[#0a1628] text-blue-500 focus:ring-blue-500/40"
            />
            <span className="text-[12px] text-slate-400 leading-snug">
              I agree to the <span className="text-blue-400 font-medium">Terms &amp; Conditions</span>{' '}
              and <span className="text-blue-400 font-medium">Privacy Policy</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-[15px] py-3.5 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-[13px] text-slate-400 pb-1">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300">
              Sign In
            </Link>
          </p>
        </form>
      </div>

      <style>{`
        .dark-input {
          width: 100%;
          background: rgba(8, 18, 36, 0.85);
          border: 1px solid rgba(59, 130, 246, 0.28);
          border-radius: 0.75rem;
          padding: 0.7rem 0.9rem;
          font-size: 14px;
          color: #e2e8f0;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .dark-input::placeholder {
          color: #64748b;
        }
        .dark-input:focus {
          outline: none;
          border-color: rgba(96, 165, 250, 0.65);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
        }
        /* date picker icon visibility on dark */
        .dark-input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          cursor: pointer;
        }
        @media (max-width: 640px) {
          .dark-input {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

function DarkField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/25">
          {icon}
        </span>
        <label className="text-[13px] font-semibold text-slate-200">{label}</label>
      </div>
      {children}
    </div>
  );
}
