import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  Monitor,
  User,
  Shield,
  CreditCard,
  Bell,
  Settings as SettingsIcon,
  Check,
} from 'lucide-react';
import { cn } from '../utils/cn';

type SettingsTab = 'profile' | 'security' | 'payments' | 'cards' | 'notifications' | 'appearance';

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Settings', icon: SettingsIcon },
];

export default function Settings() {
  const {
    user,
    updateProfile,
    logout,
    changePassword,
    setTransactionPin,
    resetTransactionPin,
  } = useAuth();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinPassword, setPinPassword] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const navigate = useNavigate();

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      const parts = fullName.trim().split(/\s+/);
      await updateProfile({
        fullName: fullName.trim(),
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        phone,
      });
      setMsg('Profile updated');
    } catch (e: any) {
      setErr(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setErr('');
    setMsg('');
    if (newPassword !== confirmPassword) {
      setErr('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setErr(e.message || 'Could not change password. Check your current password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const [pinMode, setPinMode] = useState<'set' | 'reset'>('set');

  const handleSetPin = async () => {
    setErr('');
    setMsg('');
    if (!pinPassword) {
      setErr('Enter your account password to continue');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErr('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setErr('PINs do not match');
      return;
    }
    setPinLoading(true);
    try {
      if (pinMode === 'reset' || user?.hasTransactionPin || user?.transactionPin) {
        await resetTransactionPin(pinPassword, pin);
        setMsg('Transaction PIN reset successfully. Use your new PIN for transfers.');
      } else {
        await setTransactionPin(pin, pinPassword);
        setMsg('Transaction PIN set successfully');
      }
      setPin('');
      setConfirmPin('');
      setPinPassword('');
      setPinMode('set');
    } catch (e: any) {
      setErr(e.message || 'Could not update PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage your profile, security and appearance.
        </p>
      </div>

      {(msg || err) && (
        <div
          className={cn(
            'text-sm rounded-xl px-4 py-3 mb-4',
            msg
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
              : 'bg-red-500/10 border border-red-500/30 text-red-500'
          )}
        >
          {msg || err}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Settings sub-nav — matches reference */}
        <nav className="lg:w-52 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left',
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100 settings-tab-active'
                  : 'text-gray-500 hover:bg-slate-50 hover:text-slate-700 settings-tab-idle'
              )}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {activeTab === 'appearance' && (
            <div className="rounded-2xl border border-navy-700 bg-navy-900/80 p-6 space-y-3">
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
              <p className="text-sm text-gray-400">
                Auxtra Bank uses a professional dark theme for a focused banking experience.
              </p>
              <div className="rounded-xl border border-blue-500/40 bg-blue-600/10 px-4 py-3 text-sm text-blue-300">
                Dark mode is the only available theme.
              </div>
            </div>
          )}

          {activeTab === 'profile'  && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 settings-panel">
              <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{user?.fullName}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email" value={user?.email || ''} disabled />
              <Button onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 settings-panel">
                <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button onClick={handleChangePassword} loading={pwdLoading}>
                  Change Password
                </Button>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 settings-panel">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Transaction PIN</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {user?.hasTransactionPin || user?.transactionPin
                        ? pinMode === 'reset'
                          ? 'Reset your PIN using your account password. You do not need the old PIN.'
                          : 'Your PIN is set. Change it below, or use Reset if you forgot it.'
                        : 'Set a 4-digit PIN required to confirm transfers.'}
                    </p>
                  </div>
                  {(user?.hasTransactionPin || user?.transactionPin) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPinMode(pinMode === 'reset' ? 'set' : 'reset');
                        setErr('');
                        setMsg('');
                        setPin('');
                        setConfirmPin('');
                        setPinPassword('');
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {pinMode === 'reset' ? 'Cancel reset' : 'Forgot PIN? Reset'}
                    </button>
                  )}
                </div>

                {pinMode === 'reset' && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                    Enter your <strong>login password</strong> to authorize a PIN reset, then choose a
                    new 4-digit PIN.
                  </div>
                )}

                <Input
                  label="Account password"
                  type="password"
                  value={pinPassword}
                  onChange={(e) => setPinPassword(e.target.value)}
                  placeholder="Your login password"
                />
                <Input
                  label={pinMode === 'reset' ? 'New 4-digit PIN' : '4-digit PIN'}
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                />
                <Input
                  label="Confirm PIN"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                />
                <Button onClick={handleSetPin} loading={pinLoading} className="w-full sm:w-auto">
                  {!(user?.hasTransactionPin || user?.transactionPin)
                    ? 'Set transaction PIN'
                    : pinMode === 'reset'
                      ? 'Reset PIN'
                      : 'Update PIN'}
                </Button>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm settings-panel">
                <Button variant="danger" className="w-full" onClick={handleLogout}>
                  Log Out
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm settings-panel">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Payments</h2>
              <p className="text-sm text-slate-500">
                Manage bill payments and international transfers from the Payments section in the
                main menu.
              </p>
              <Button className="mt-4" onClick={() => navigate('/payments')}>
                Go to Payments
              </Button>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm settings-panel">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Cards</h2>
              <p className="text-sm text-slate-500">
                View, freeze, or manage your virtual and physical cards.
              </p>
              <Button className="mt-4" onClick={() => navigate('/cards')}>
                Go to Cards
              </Button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm settings-panel">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Notifications</h2>
              <p className="text-sm text-slate-500">
                Review alerts for transfers, loans, and account activity.
              </p>
              <Button className="mt-4" onClick={() => navigate('/notifications')}>
                View Notifications
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
