import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import { User, Mail, Phone, CreditCard, Shield, Camera, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, account, updateProfile, uploadProfilePhoto, removeProfilePhoto } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const displayPhoto = user?.photoURL;

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
      setMsg('Profile updated successfully');
    } catch (e: any) {
      setErr(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('Please choose an image file (JPG, PNG, or WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr('Image must be under 5 MB');
      return;
    }
    setErr('');
    setMsg('');
    setPhotoLoading(true);
    try {
      await uploadProfilePhoto(file);
      setMsg('Profile photo updated');
    } catch (err: any) {
      setErr(err.message || 'Could not upload photo');
    } finally {
      setPhotoLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.photoURL) return;
    if (!confirm('Remove your profile photo?')) return;
    setPhotoLoading(true);
    setErr('');
    try {
      await removeProfilePhoto();
      setMsg('Profile photo removed');
    } catch (e: any) {
      setErr(e.message || 'Could not remove photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
      <div className="rounded-2xl bg-blue-600/10 border border-blue-500/20 px-4 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your personal account information</p>
        </div>
      </div>

      {/* Identity + photo */}
      <div className="rounded-2xl border border-navy-700 bg-gradient-to-br from-navy-800 to-navy-900 p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-blue-600/30 ring-2 ring-navy-600">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                (user?.fullName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <button
              type="button"
              disabled={photoLoading}
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg border-2 border-navy-900 disabled:opacity-60"
              title="Change photo"
              aria-label="Upload profile photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          <div className="min-w-0 text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-white truncate">{user?.fullName}</h2>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
              {user?.role === 'admin' ? 'Administrator' : 'Customer'}
            </span>
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <Button
                size="sm"
                variant="outline"
                loading={photoLoading}
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                {user?.photoURL ? 'Change photo' : 'Add photo'}
              </Button>
              {user?.photoURL && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={photoLoading}
                  onClick={handleRemovePhoto}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              JPG, PNG or WebP · Max 5 MB
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-navy-700 bg-navy-900/60 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <CreditCard className="w-3.5 h-3.5" /> Account
          </div>
          <p className="text-white font-mono text-sm">{account?.accountNumber || '—'}</p>
        </div>
        <div className="rounded-2xl border border-navy-700 bg-navy-900/60 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Shield className="w-3.5 h-3.5" /> Balance
          </div>
          <p className="text-white font-semibold text-sm">
            {formatCurrency(account?.availableBalance ?? 0)}
          </p>
        </div>
      </div>

      {(msg || err) && (
        <div
          className={`text-sm rounded-xl px-4 py-3 ${
            msg
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {msg || err}
        </div>
      )}

      <div className="rounded-2xl border border-navy-700 bg-navy-900/60 p-5 space-y-4">
        <h3 className="font-semibold text-white">Personal details</h3>
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input label="Email" value={user?.email || ''} disabled />
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1..."
        />
        <Button onClick={handleSave} loading={saving} className="w-full">
          Save profile
        </Button>
      </div>

      <div className="rounded-2xl border border-navy-700 bg-navy-900/60 p-5 space-y-3">
        <h3 className="font-semibold text-white">Security & settings</h3>
        <p className="text-sm text-gray-400">
          Change password, transaction PIN, and more in Settings.
        </p>
        <Link to="/settings">
          <Button variant="outline" className="w-full">
            Open Settings
          </Button>
        </Link>
      </div>
</div>
  );
}
