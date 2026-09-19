import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { WestbridgeLogo } from '../components/ui/WestbridgeLogo';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  LogIn,
  ArrowRight,
} from 'lucide-react';

const HERO_BG =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full bg-[#0a1628]/80 border border-blue-500/25 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50';

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Background image + overlays */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#060d18]/95 via-[#0a1628]/92 to-[#060d18]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#060d18]/80 to-transparent" />
      <div className="relative flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 max-w-md mx-auto w-full min-h-[100dvh]">
        {/* Brand */}
        <div className="mb-8">
          <WestbridgeLogo size={32} />
          <p className="text-xs text-slate-400 mt-1.5 ml-0.5">
            Secure Banking. A Brighter Future.
          </p>
        </div>

        {/* Shield */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600/25 border border-blue-400/30 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <div className="w-11 h-11 rounded-full bg-blue-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-200" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-center text-white tracking-tight">
          Welcome <span className="text-blue-400">back</span>
        </h1>
        <p className="text-center text-slate-400 text-sm mt-2 mb-8">
          Sign in to your Auxtra Bank account
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-blue-500/20 bg-[#0c1a2e]/80 backdrop-blur-md p-5 sm:p-6 space-y-5 shadow-2xl"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Lock className="w-4 h-4 text-blue-400" />
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPass ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={fieldClass + ' pr-11'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-center text-sm text-slate-400 pt-1">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign up
            </Link>
          </p>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-center">
          <Shield className="w-4 h-4 text-blue-400/80" />
          <div>
            <p className="text-xs font-medium text-slate-300">Your security is our priority</p>
            <p className="text-[11px] text-slate-500">This connection is encrypted and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
