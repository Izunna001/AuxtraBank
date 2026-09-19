import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WestbridgeLogo } from '../components/ui/WestbridgeLogo';
import { Mail, Shield, CheckCircle2, RefreshCw, LogOut, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const {
    user,
    logout,
    resendVerificationEmail,
    refreshEmailVerification,
  } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user?.emailVerified || user?.role === 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Poll verification status periodically while on this page
  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        const ok = await refreshEmailVerification();
        if (ok) navigate('/dashboard', { replace: true });
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [refreshEmailVerification, navigate]);

  const handleResend = async () => {
    setErr('');
    setMsg('');
    setSending(true);
    try {
      await resendVerificationEmail();
      setMsg('Verification email sent. Check your inbox and spam folder.');
    } catch (e: any) {
      setErr(e.message || 'Could not resend email');
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setErr('');
    setMsg('');
    setChecking(true);
    try {
      const ok = await refreshEmailVerification();
      if (ok) {
        setMsg('Email verified! Redirecting…');
        navigate('/dashboard', { replace: true });
      } else {
        setMsg('Not verified yet. Open the link in your email, then try again.');
      }
    } catch (e: any) {
      setErr(e.message || 'Could not check status');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[100dvh] relative flex flex-col items-center justify-center px-5 py-10">
      <div className="absolute inset-0 bg-navy-950" />
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(37,99,235,0.35), transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-6">
          <WestbridgeLogo size={32} />
        </div>

        <div className="rounded-2xl border border-blue-500/25 bg-[#0c1a30]/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Mail className="w-7 h-7 text-blue-400" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Verify your email</h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              We sent a verification link to
            </p>
            <p className="text-blue-300 font-medium text-sm mt-1 break-all">
              {user?.email || 'your email'}
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Open the email and tap the link to activate your Auxtra Bank account. Check spam if
            you don&apos;t see it within a few minutes.
          </p>

          {(msg || err) && (
            <div
              className={`text-sm rounded-xl px-4 py-3 text-left ${
                err
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              }`}
            >
              {err || msg}
            </div>
          )}

          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3.5 shadow-lg shadow-blue-600/25 disabled:opacity-60"
          >
            {checking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            I&apos;ve verified — Continue
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-medium py-3 hover:bg-white/10 disabled:opacity-60"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Resend verification email
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
            <Shield className="w-3.5 h-3.5 text-blue-400/80" />
            Secure email confirmation required
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 pt-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Wrong account?{' '}
          <Link to="/login" onClick={handleLogout} className="text-blue-400 hover:underline">
            Use another email
          </Link>
        </p>
      </div>
    </div>
  );
}
