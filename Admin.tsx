import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import {
  Users,
  Search,
  Send,
  HandCoins,
  Check,
  X,
  CreditCard,
  Snowflake,
  Eye,
  Settings2,
  Shield,
  Building2,
  Link2,
  FileText,
  Lock,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import type { StoredUser } from '../../types';

type Tab = 'users' | 'loans' | 'fees' | 'payments';

export default function Admin() {
  const {
    user,
    account,
    allUsers,
    isAdmin,
    adminTransferToUser,
    adminReviewLoan,
    paymentSettings,
    savePaymentSettings,
    feePaymentRequests,
    confirmLoanFeePayment,
    freezeUserAccount,
    clearUserBalance,
    clearUserLoans,
    adminClearUserPin,
    adminAssignCard,
    adminFactoryReset,
    reauthenticate,
    refreshData,
  } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedUid, setSelectedUid] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [detailUser, setDetailUser] = useState<StoredUser | null>(null);
  const [tab, setTab] = useState<Tab>('users');
  const [adminPassword, setAdminPassword] = useState('');

  const [payForm, setPayForm] = useState({
    paypalEmail: '',
    paypalLink: '',
    cardInstructions: '',
    bankName: 'Auxtra Bank',
    bankAccountName: 'Auxtra Bank Admin',
    bankAccountNumber: '',
    additionalNotes: '',
  });

  useEffect(() => {
    if (paymentSettings) {
      setPayForm({
        paypalEmail: paymentSettings.paypalEmail || '',
        paypalLink: paymentSettings.paypalLink || '',
        cardInstructions: paymentSettings.cardInstructions || '',
        bankName: paymentSettings.bankName || 'Auxtra Bank',
        bankAccountName: paymentSettings.bankAccountName || 'Auxtra Bank Admin',
        bankAccountNumber: paymentSettings.bankAccountNumber || '',
        additionalNotes: paymentSettings.additionalNotes || '',
      });
    }
  }, [paymentSettings]);

  if (!isAdmin) {
    return null;
  }

  const regularUsers = allUsers.filter((u) => u.profile.role !== 'admin');
  const q = search.trim().toLowerCase();
  const filtered = regularUsers.filter((u) => {
    if (!q) return true;
    return (
      u.profile.fullName.toLowerCase().includes(q) ||
      u.profile.email.toLowerCase().includes(q) ||
      (u.profile.phone || '').includes(q) ||
      u.account.accountNumber.includes(q)
    );
  });
  const selected = regularUsers.find((u) => u.profile.uid === selectedUid);
  const pendingLoans = regularUsers.flatMap((u) =>
    u.loans.filter((l) => l.status === 'pending').map((l) => ({ user: u, loan: l }))
  );
  const pendingFees = feePaymentRequests.filter((r) => r.status === 'pending');

  const flash = (ok: string, error?: string) => {
    setMsg(ok);
    setErr(error || '');
    setTimeout(() => {
      setMsg('');
      setErr('');
    }, 4000);
  };

  const isFrozen = (u: StoredUser) =>
    Boolean(u.profile.accountFrozen) || u.account.status === 'frozen';

  const handleTransfer = async () => {
    if (!selectedUid) {
      setErr('Select a user from the list first');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setErr('Enter a valid amount');
      return;
    }
    if (!adminPassword.trim()) {
      setErr('Enter your admin account password to authorize this transfer');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await reauthenticate(adminPassword);
      await adminTransferToUser(selectedUid, amt, note || undefined);
      flash(`Sent ${formatCurrency(amt)} to ${selected?.profile.fullName}`);
      setAmount('');
      setNote('');
      setAdminPassword('');
      refreshData();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCard = async (uid: string, name: string) => {
    if (!adminPassword.trim()) {
      setErr('Enter your admin password in Send funds (password field) to assign a card');
      return;
    }
    if (!confirm(`Issue a new virtual card to ${name}?`)) return;
    setLoading(true);
    setErr('');
    try {
      await reauthenticate(adminPassword);
      await adminAssignCard(uid);
      flash(`Card assigned to ${name}`);
      refreshData();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayments = async () => {
    setLoading(true);
    try {
      await savePaymentSettings(payForm);
      flash('Payment details saved');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { id: 'users', label: 'Users & transfer', icon: Users },
    { id: 'loans', label: 'Loan review', icon: HandCoins },
    { id: 'fees', label: 'Fee payments', icon: CreditCard, badge: pendingFees.length || undefined },
    { id: 'payments', label: 'PayPal / Card setup', icon: Link2 },
  ];

  const fieldClass =
    'w-full bg-[#0a1220] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40';

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl mx-auto min-w-0 w-full overflow-x-hidden">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#0d1b33] via-[#0f2240] to-[#0a1628] px-5 py-5 sm:px-6">
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 100% 0%, rgba(37,99,235,0.35), transparent 55%)',
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                System balance:{' '}
                <span className="text-blue-300 font-medium">
                  {formatCurrency(account?.availableBalance ?? 0)}
                </span>
                <span className="text-slate-600"> · </span>
                <span className="text-slate-400">{user?.email}</span>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
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

      {/* Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2.5 px-3 sm:px-4 py-3 rounded-2xl text-sm font-medium border transition-all text-left ${
              tab === id
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25'
                : 'bg-[#121a28] border-white/5 text-slate-400 hover:border-blue-500/30 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge ? (
              <span className="bg-amber-500 text-navy-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            ) : (
              <ChevronRight className={`w-4 h-4 shrink-0 opacity-50 ${tab === id ? 'text-white' : ''}`} />
            )}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Users list */}
          <div className="rounded-2xl border border-white/5 bg-[#0d1525] p-4 sm:p-5 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Users
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by account number or account name..."
                className={fieldClass}
              />
            </div>

            <div className="max-h-[28rem] overflow-y-auto space-y-3 pr-1">
              {filtered.map((u) => {
                const frozen = isFrozen(u);
                const active = selectedUid === u.profile.uid;
                return (
                  <div
                    key={u.profile.uid}
                    className={`rounded-2xl border p-4 transition-all ${
                      active
                        ? 'border-blue-500/50 bg-blue-600/10'
                        : 'border-white/5 bg-[#121a28] hover:border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full text-left flex items-center gap-3 mb-3"
                      onClick={() => setSelectedUid(u.profile.uid)}
                    >
                      <div className="w-11 h-11 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {u.profile.fullName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {u.account.accountNumber} · {formatCurrency(u.account.balance)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                          frozen
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                            frozen ? 'bg-red-400' : 'bg-emerald-400'
                          }`}
                        />
                        {frozen ? 'Frozen' : 'Active'}
                      </span>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <ActionBtn
                        onClick={() => setDetailUser(u)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                        label="View"
                        color="blue"
                      />
                      <ActionBtn
                        onClick={async () => {
                          try {
                            await freezeUserAccount(u.profile.uid, !frozen);
                            flash(frozen ? `Unfroze ${u.profile.fullName}` : `Froze ${u.profile.fullName}`);
                          } catch (e: any) {
                            setErr(e.message);
                          }
                        }}
                        icon={<Snowflake className="w-3.5 h-3.5" />}
                        label={frozen ? 'Unfreeze' : 'Freeze'}
                        color="cyan"
                      />
                      <ActionBtn
                        onClick={async () => {
                          if (!confirm(`Clear all loans for ${u.profile.fullName}?`)) return;
                          try {
                            await clearUserLoans(u.profile.uid);
                            flash(`Cleared loans for ${u.profile.fullName}`);
                          } catch (e: any) {
                            setErr(e.message);
                          }
                        }}
                        icon={<FileText className="w-3.5 h-3.5" />}
                        label="Clear loans"
                        color="amber"
                      />
                      <ActionBtn
                        onClick={async () => {
                          if (!confirm(`Clear PIN for ${u.profile.fullName}?`)) return;
                          try {
                            await adminClearUserPin(u.profile.uid);
                            flash(`PIN cleared for ${u.profile.fullName}`);
                          } catch (e: any) {
                            setErr(e.message);
                          }
                        }}
                        icon={<Lock className="w-3.5 h-3.5" />}
                        label="Clear PIN"
                        color="violet"
                      />
                      <ActionBtn
                        onClick={() => handleAssignCard(u.profile.uid, u.profile.fullName)}
                        icon={<CreditCard className="w-3.5 h-3.5" />}
                        label="Assign card"
                        color="blue"
                      />
                      <ActionBtn
                        onClick={async () => {
                          if (!confirm(`Clear balance for ${u.profile.fullName} to $0?`)) return;
                          try {
                            await clearUserBalance(u.profile.uid);
                            flash(`Cleared balance for ${u.profile.fullName}`);
                          } catch (e: any) {
                            setErr(e.message);
                          }
                        }}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        label="Clear balance"
                        color="red"
                      />
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-10">No users found</p>
              )}
            </div>
          </div>

          {/* Send funds */}
          <div className="rounded-2xl border border-white/5 bg-[#0d1525] p-4 sm:p-5 space-y-4 h-fit">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" /> Send funds
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Credit a user by account number or name. Select them from the list first.
            </p>

            {selected && (
              <div className="rounded-xl bg-blue-600/10 border border-blue-500/25 px-4 py-3">
                <p className="text-white font-medium text-sm">{selected.profile.fullName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selected.account.accountNumber} · {formatCurrency(selected.account.balance)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Amount ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Note (optional)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Salary credit..."
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Admin password *</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter your account password"
                autoComplete="current-password"
                className={fieldClass.replace('pl-10 ', 'pl-4 ')}
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Required to send funds or assign cards
              </p>
            </div>

            <Button
              onClick={handleTransfer}
              loading={loading}
              className="w-full"
              size="lg"
              disabled={!selectedUid}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Funds
            </Button>
          </div>
        </div>
      )}

      {/* LOANS TAB */}
      {tab === 'loans' && (
        <div className="rounded-2xl border border-white/5 bg-[#0d1525] p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-blue-400" /> Pending loan applications
          </h3>
          {pendingLoans.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No pending loans</p>
          ) : (
            pendingLoans.map(({ user: u, loan }) => (
              <div
                key={loan.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/5 bg-[#121a28] rounded-2xl p-4"
              >
                <div>
                  <p className="text-white font-medium">{u.profile.fullName}</p>
                  <p className="text-sm text-slate-400">
                    {formatCurrency(loan.amount)} · {loan.periodMonths} months
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {u.account.accountNumber}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await adminReviewLoan(u.profile.uid, loan.id, 'approved');
                        flash('Loan approved & funded');
                      } catch (e: any) {
                        setErr(e.message);
                      }
                    }}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await adminReviewLoan(u.profile.uid, loan.id, 'rejected');
                        flash('Loan rejected');
                      } catch (e: any) {
                        setErr(e.message);
                      }
                    }}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FEES TAB */}
      {tab === 'fees' && (
        <div className="rounded-2xl border border-white/5 bg-[#0d1525] p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-white">Loan fee payment submissions</h3>
          <p className="text-sm text-slate-400">
            Users pay via PayPal/card then submit a reference. Confirm after you verify the payment.
          </p>
          {pendingFees.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No pending fee payments</p>
          ) : (
            pendingFees.map((r) => (
              <div
                key={r.id}
                className="border border-white/5 bg-[#121a28] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-white font-medium">{r.userName}</p>
                  <p className="text-sm text-amber-400">
                    Fee {formatCurrency(r.feeAmount)} (loan {formatCurrency(r.amount)})
                  </p>
                  <p className="text-xs font-mono text-slate-400 mt-1">Ref: {r.reference}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await confirmLoanFeePayment(r.id, true);
                        flash('Fee confirmed — user unlocked');
                      } catch (e: any) {
                        setErr(e.message);
                      }
                    }}
                  >
                    Confirm paid
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await confirmLoanFeePayment(r.id, false);
                        flash('Fee submission rejected');
                      } catch (e: any) {
                        setErr(e.message);
                      }
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PAYMENTS SETUP TAB */}
      {tab === 'payments' && (
        <div className="rounded-2xl border border-white/5 bg-[#0d1525] p-4 sm:p-5 space-y-4 max-w-xl">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-400" /> PayPal & card details
          </h3>
          <p className="text-sm text-slate-400">
            Shown to users on the loan fee payment page.
          </p>
          <Input
            label="PayPal email"
            value={payForm.paypalEmail}
            onChange={(e) => setPayForm({ ...payForm, paypalEmail: e.target.value })}
            placeholder="payments@westbridge-bank.com"
          />
          <Input
            label="PayPal.me or payment link"
            value={payForm.paypalLink}
            onChange={(e) => setPayForm({ ...payForm, paypalLink: e.target.value })}
            placeholder="https://paypal.me/..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Card payment instructions
            </label>
            <textarea
              value={payForm.cardInstructions}
              onChange={(e) => setPayForm({ ...payForm, cardInstructions: e.target.value })}
              rows={4}
              className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <Input
            label="Bank name"
            value={payForm.bankName}
            onChange={(e) => setPayForm({ ...payForm, bankName: e.target.value })}
          />
          <Input
            label="Account name"
            value={payForm.bankAccountName}
            onChange={(e) => setPayForm({ ...payForm, bankAccountName: e.target.value })}
          />
          <Input
            label="Account number"
            value={payForm.bankAccountNumber}
            onChange={(e) => setPayForm({ ...payForm, bankAccountNumber: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Additional notes
            </label>
            <textarea
              value={payForm.additionalNotes}
              onChange={(e) => setPayForm({ ...payForm, additionalNotes: e.target.value })}
              rows={2}
              className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <Button onClick={handleSavePayments} loading={loading}>
            Save payment details
          </Button>

          <div className="mt-8 pt-6 border-t border-red-500/20 space-y-3">
            <h4 className="text-sm font-semibold text-red-400">System reset</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Wipe all transactions, loans, notifications, and savings. Reset every user balance to
              $0.00 and credit the admin account with $50,000,000,000.00 USD. User profiles stay
              registered.
            </p>
            <Button
              variant="danger"
              loading={loading}
              onClick={async () => {
                if (
                  !confirm(
                    'START FRESH? This deletes ALL transactions, loans, fees, notifications, and savings. User balances become $0. Admin gets $50 billion USD. Continue?'
                  )
                ) {
                  return;
                }
                if (!adminPassword.trim()) {
                  setErr('Enter your admin password in Send funds first');
                  return;
                }
                setLoading(true);
                setErr('');
                try {
                  await reauthenticate(adminPassword);
                  await adminFactoryReset();
                  flash('System reset complete. Admin balance: $50,000,000,000.00');
                  refreshData();
                } catch (e: any) {
                  setErr(e.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Start fresh — reset system
            </Button>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1525] p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-white">User information</h3>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Full name" value={detailUser.profile.fullName} />
              <Row label="Email" value={detailUser.profile.email} />
              <Row label="Phone" value={detailUser.profile.phone || '—'} />
              <Row label="Account number" value={detailUser.account.accountNumber} />
              <Row label="Balance" value={formatCurrency(detailUser.account.balance)} />
              <Row
                label="Status"
                value={isFrozen(detailUser) ? 'Frozen' : 'Active'}
              />
              <Row label="Account type" value={detailUser.account.accountType} />
              <Row label="Loans" value={String(detailUser.loans.length)} />
              <Row
                label="Joined"
                value={detailUser.profile.createdAt?.slice(0, 10) || '—'}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await freezeUserAccount(detailUser.profile.uid, !isFrozen(detailUser));
                  setDetailUser(null);
                  flash('Account status updated');
                }}
              >
                {isFrozen(detailUser) ? 'Unfreeze' : 'Freeze'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  if (!confirm('Clear all loans?')) return;
                  await clearUserLoans(detailUser.profile.uid);
                  setDetailUser(null);
                  flash('Loans cleared');
                }}
              >
                Clear loans
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="flex-1"
                onClick={async () => {
                  if (!confirm('Clear balance to $0?')) return;
                  await clearUserBalance(detailUser.profile.uid);
                  setDetailUser(null);
                  flash('Balance cleared');
                }}
              >
                Clear balance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'cyan' | 'amber' | 'violet' | 'red';
}) {
  const styles = {
    blue: 'bg-blue-600/15 text-blue-300 border-blue-500/25 hover:bg-blue-600/25',
    cyan: 'bg-cyan-600/15 text-cyan-300 border-cyan-500/25 hover:bg-cyan-600/25',
    amber: 'bg-amber-600/15 text-amber-300 border-amber-500/25 hover:bg-amber-600/25',
    violet: 'bg-violet-600/15 text-violet-300 border-violet-500/25 hover:bg-violet-600/25',
    red: 'bg-red-600/10 text-red-400 border-red-500/30 hover:bg-red-600/20',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-colors ${styles[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-white text-right font-medium break-all">{value}</span>
    </div>
  );
}
