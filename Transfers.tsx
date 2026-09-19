import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import {
  CheckCircle2,
  ArrowLeft,
  UserCheck,
  Send,
  Shield,
  User,
  Building2,
  FileText,
  Share2,
  Download,
  Home,
} from 'lucide-react';
import { LoanFeeNotice } from '../components/ui/LoanFeeNotice';
import { WestbridgeLogo } from '../components/ui/WestbridgeLogo';

const HOME_BANK = 'Auxtra Bank';

const BANKS = [
  HOME_BANK,
  'HSBC',
  'Barclays',
  'Deutsche Bank',
  'BNP Paribas',
  'Standard Chartered',
  'Citibank',
  'JPMorgan Chase',
  'Bank of America',
  'Wells Fargo',
  'UBS',
  'Santander',
  'ING',
  'DBS Bank',
  'Access Bank',
  'GTBank',
  'Zenith Bank',
  'Other',
];

export default function Transfers() {
  const {
    transfer,
    account,
    needsLoanFee,
    getPendingLoanFee,
    getAdminAccountNumber,
    lookupAccountByNumber,
    verifyTransactionPin,
    reauthenticate,
    user,
  } = useAuth();
  const [step, setStep] = useState<'form' | 'confirm' | 'pin' | 'success'>('form');
  const [form, setForm] = useState({
    recipientName: '',
    bankName: HOME_BANK,
    accountNumber: '',
    amount: '',
    description: '',
  });
  const [pin, setPin] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>(
    'idle'
  );
  const [resolvedName, setResolvedName] = useState('');

  const fee = 1;
  const amountNum = parseFloat(form.amount) || 0;
  const total = amountNum + fee;
  const loanFeeRequired = needsLoanFee();
  const pendingLoan = getPendingLoanFee();
  const adminAcct = getAdminAccountNumber();

  useEffect(() => {
    const num = form.accountNumber.replace(/\s/g, '');
    if (num.length < 8) {
      setLookupStatus('idle');
      setResolvedName('');
      return;
    }
    let cancelled = false;
    setLookupStatus('loading');
    const t = setTimeout(async () => {
      try {
        const result = await lookupAccountByNumber(num);
        if (cancelled) return;
        if (result) {
          setResolvedName(result.accountName);
          setForm((f) => ({
            ...f,
            recipientName: result.accountName,
            bankName: HOME_BANK,
          }));
          setLookupStatus('found');
        } else {
          setResolvedName('');
          setLookupStatus('notfound');
          setForm((f) => ({ ...f, recipientName: '' }));
        }
      } catch {
        if (!cancelled) setLookupStatus('notfound');
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [form.accountNumber, lookupAccountByNumber]);

  const handleNext = () => {
    setError('');
    if (loanFeeRequired && pendingLoan) {
      setError(
        `Pay the 10% loan fee (${formatCurrency(pendingLoan.fee)}) before transferring.`
      );
      return;
    }
    const num = form.accountNumber.replace(/\s/g, '');
    if (!num || num.length < 8) {
      setError('Please enter a valid account number');
      return;
    }
    if (form.bankName === HOME_BANK || form.bankName.startsWith('Auxtra') || form.bankName.startsWith('Westbridge')) {
      if (lookupStatus !== 'found' || !resolvedName) {
        setError(
          'Account number does not match any Auxtra Bank account. Please enter the correct account number.'
        );
        return;
      }
    }
    if (!form.recipientName || !form.bankName || amountNum <= 0) {
      setError('Please fill all required fields');
      return;
    }
    if (account && account.availableBalance < total) {
      setError('Insufficient balance');
      return;
    }
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!accountPassword.trim()) {
      setError('Enter your account password to authorize this transfer.');
      return;
    }
    if (!user?.hasTransactionPin && !user?.transactionPin) {
      setError('Set a 4-digit transaction PIN in Settings before transferring.');
      return;
    }
    if (pin.length < 4) {
      setError('Enter your 4-digit transaction PIN');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await reauthenticate(accountPassword);
      const ok = await verifyTransactionPin(pin);
      if (!ok) {
        throw new Error('Incorrect transaction PIN. Check your PIN in Settings.');
      }
      const tx = await transfer({
        recipientName: form.recipientName,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        amount: amountNum,
        description: form.description || `Transfer to ${form.recipientName}`,
      });
      setRef(tx.reference);
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full bg-navy-900/60 border border-navy-600 rounded-xl px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50';

  if (step === 'success') {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const last4 = form.accountNumber.replace(/\s/g, '').slice(-4) || '----';
    const shareText = `Auxtra Bank Transfer\nAmount: ${formatCurrency(amountNum)}\nTo: ${form.recipientName}\nRef: ${ref}\nStatus: Successful`;

    const handleShare = async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Auxtra Bank Receipt', text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          alert('Receipt copied to clipboard');
        }
      } catch {
        /* cancelled */
      }
    };


    function roundRect(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function drawParty(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      label: string,
      name: string,
      sub: string
    ) {
      ctx.fillStyle = 'rgba(37,99,235,0.25)';
      ctx.beginPath();
      ctx.arc(x + 18, y + 4, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui,sans-serif';
      ctx.fillText(label, x + 48, y - 6);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 15px system-ui,sans-serif';
      ctx.fillText(name.length > 36 ? name.slice(0, 36) + '…' : name, x + 48, y + 14);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui,sans-serif';
      ctx.fillText(sub, x + 48, y + 32);
    }

    const buildReceiptCanvas = () => {
      const W = 720;
      const H = 960;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create receipt image');

      // Background
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, W, H);

      // Card
      const pad = 40;
      const cardX = pad;
      const cardY = 120;
      const cardW = W - pad * 2;
      const cardH = 680;
      ctx.fillStyle = '#0d1525';
      roundRect(ctx, cardX, cardY, cardW, cardH, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      roundRect(ctx, cardX, cardY, cardW, cardH, 24);
      ctx.stroke();

      // Success circle
      ctx.beginPath();
      ctx.arc(W / 2, 70, 36, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16,185,129,0.35)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', W / 2, 82);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui,sans-serif';
      ctx.fillText('Transfer Successful', W / 2, 100);

      let y = cardY + 36;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '600 11px system-ui,sans-serif';
      ctx.fillText('TRANSFER RECEIPT', cardX + 28, y);
      ctx.fillStyle = '#60a5fa';
      ctx.font = '12px ui-monospace,monospace';
      ctx.fillText(ref, cardX + 28, y + 18);

      // Badge
      ctx.fillStyle = 'rgba(16,185,129,0.15)';
      roundRect(ctx, cardX + cardW - 130, y - 12, 100, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = '600 12px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('● Successful', cardX + cardW - 80, y + 6);
      ctx.textAlign = 'left';

      y += 56;
      ctx.fillStyle = '#64748b';
      ctx.font = '12px system-ui,sans-serif';
      ctx.fillText('Amount', cardX + 28, y);
      ctx.textAlign = 'right';
      ctx.fillText('Date & Time', cardX + cardW - 28, y);
      ctx.textAlign = 'left';
      y += 28;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui,sans-serif';
      ctx.fillText(formatCurrency(amountNum), cardX + 28, y);
      ctx.textAlign = 'right';
      ctx.font = '14px system-ui,sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${dateStr} · ${timeStr}`, cardX + cardW - 28, y);
      ctx.textAlign = 'left';

      y += 24;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(cardX + 28, y);
      ctx.lineTo(cardX + cardW - 28, y);
      ctx.stroke();

      y += 36;
      drawParty(ctx, cardX + 28, y, 'From', user?.fullName || 'You', 'Auxtra Bank');
      y += 72;
      drawParty(
        ctx,
        cardX + 28,
        y,
        'To',
        form.recipientName,
        `${form.bankName || 'Auxtra Bank'} · **** ${last4}`
      );

      y += 72;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(cardX + 28, y);
      ctx.lineTo(cardX + cardW - 28, y);
      ctx.stroke();

      y += 28;
      ctx.fillStyle = '#64748b';
      ctx.font = '600 11px system-ui,sans-serif';
      ctx.fillText('TRANSACTION DETAILS', cardX + 28, y);
      y += 28;
      const rows: [string, string, string?][] = [
        ['Reference Number', ref, '#60a5fa'],
        ['Status', 'Successful', '#34d399'],
        ['Transaction Type', 'Bank Transfer'],
        ['Channel', 'Web'],
      ];
      for (const [label, value, color] of rows) {
        ctx.fillStyle = '#64748b';
        ctx.font = '13px system-ui,sans-serif';
        ctx.fillText(label, cardX + 28, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = color || '#e2e8f0';
        ctx.font = color ? '12px ui-monospace,monospace' : '13px system-ui,sans-serif';
        const maxW = cardW - 200;
        let v = value;
        if (ctx.measureText(v).width > maxW) {
          while (v.length > 8 && ctx.measureText(v + '…').width > maxW) v = v.slice(0, -1);
          v = v + '…';
        }
        ctx.fillText(v, cardX + cardW - 28, y);
        ctx.textAlign = 'left';
        y += 26;
      }

      // Footer bar
      const fy = cardY + cardH - 56;
      const grd = ctx.createLinearGradient(cardX, fy, cardX + cardW, fy);
      grd.addColorStop(0, '#1d4ed8');
      grd.addColorStop(1, '#2563eb');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(cardX, fy);
      ctx.lineTo(cardX + cardW, fy);
      ctx.lineTo(cardX + cardW, cardY + cardH - 24);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - 24, cardY + cardH);
      ctx.lineTo(cardX + 24, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui,sans-serif';
      ctx.fillText('Auxtra Bank', cardX + 28, fy + 32);
      ctx.textAlign = 'right';
      ctx.font = 'italic 12px system-ui,sans-serif';
      ctx.fillStyle = 'rgba(219,234,254,0.85)';
      ctx.fillText('Your Success, Our Priority', cardX + cardW - 28, fy + 32);
      ctx.textAlign = 'left';

      // Bottom tagline
      ctx.fillStyle = '#475569';
      ctx.font = '12px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Auxtra Bank · Safe · Simple · Smart', W / 2, H - 28);
      ctx.textAlign = 'left';

      return canvas;
    };

    const handleDownloadImage = () => {
      try {
        const canvas = buildReceiptCanvas();
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `auxtra-receipt-${ref.replace(/[^\w-]/g, '_')}.png`;
        a.click();
      } catch (e: any) {
        alert(e.message || 'Could not download image');
      }
    };

    const handleDownloadPdf = () => {
      try {
        const canvas = buildReceiptCanvas();
        const img = canvas.toDataURL('image/jpeg', 0.92);
        const jpeg = atob(img.split(',')[1]);
        const bytes = new Uint8Array(jpeg.length);
        for (let i = 0; i < jpeg.length; i++) bytes[i] = jpeg.charCodeAt(i);

        const pageW = 612;
        const pageH = 792;
        const imgW = pageW - 48;
        const imgH = (canvas.height / canvas.width) * imgW;
        const ox = 24;
        const oy = Math.max(24, (pageH - imgH) / 2);
        const contentStream = `q
${imgW} 0 0 ${imgH} ${ox} ${pageH - oy - imgH} cm
/Im0 Do
Q
`;

        const encoder = new TextEncoder();
        const chunks: Uint8Array[] = [];
        let len = 0;
        const pushStr = (s: string) => {
          const u = encoder.encode(s);
          chunks.push(u);
          len += u.length;
        };
        const objOffsets: number[] = [0];
        const startObj = () => {
          objOffsets.push(len);
        };

        pushStr('%PDF-1.4\n');
        startObj();
        pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
        startObj();
        pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
        startObj();
        pushStr(
          `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>\nendobj\n`
        );
        startObj();
        pushStr(
          `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
        );
        startObj();
        pushStr(
          `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`
        );
        chunks.push(bytes);
        len += bytes.length;
        pushStr('\nendstream\nendobj\n');

        const xrefPos = len;
        pushStr(`xref\n0 ${objOffsets.length}\n`);
        pushStr('0000000000 65535 f \n');
        for (let i = 1; i < objOffsets.length; i++) {
          pushStr(`${String(objOffsets[i]).padStart(10, '0')} 00000 n \n`);
        }
        pushStr(
          `trailer\n<< /Size ${objOffsets.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`
        );

        const total = chunks.reduce((s, c) => s + c.length, 0);
        const out = new Uint8Array(total);
        let o = 0;
        for (const c of chunks) {
          out.set(c, o);
          o += c.length;
        }
        const blob = new Blob([out], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auxtra-receipt-${ref.replace(/[^\w-]/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        handleDownloadImage();
      }
    };

    const handleDownload = () => handleDownloadPdf();


    return (
      <div className="max-w-md mx-auto animate-scale-in space-y-5 pb-4">
        {/* Success hero */}
        <div className="text-center pt-2">
          <div className="relative mx-auto w-20 h-20 mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-emerald-500/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Transfer Successful</h2>
          <p className="text-slate-400 text-sm mt-1">Your money is on its way</p>
        </div>

        {/* Receipt card */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden shadow-xl">
          <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Transfer Receipt
              </p>
              <p className="text-xs font-mono text-blue-400/90 mt-0.5 break-all">{ref}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Successful
            </span>
          </div>

          <div className="px-5 pb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-slate-500 mb-0.5">Amount</p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {formatCurrency(amountNum)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 mb-0.5">Date &amp; Time</p>
              <p className="text-sm text-slate-200">
                {dateStr} · {timeStr}
              </p>
            </div>
          </div>

          <div className="mx-5 border-t border-white/5" />

          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/25 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">From</p>
                <p className="text-sm font-semibold text-white truncate">
                  {user?.fullName || 'You'}
                </p>
                <p className="text-[11px] text-slate-500">Auxtra Bank</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/25 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">To</p>
                <p className="text-sm font-semibold text-white truncate">{form.recipientName}</p>
                <p className="text-[11px] text-slate-500">
                  {form.bankName || 'Auxtra Bank'} · **** {last4}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-5 border-t border-white/5" />

          <div className="px-5 py-4 space-y-2.5 text-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Transaction Details
            </p>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Reference Number</span>
              <span className="text-blue-400 font-mono text-xs text-right break-all">{ref}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="text-emerald-400 font-medium">Successful</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Type</span>
              <span className="text-slate-200">Bank Transfer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Channel</span>
              <span className="text-slate-200">Web</span>
            </div>
          </div>

          {/* Footer brand */}
          <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-blue-600 flex items-center justify-between gap-3">
            <WestbridgeLogo size={22} />
            <p className="text-[10px] text-blue-100/80 italic">Your Success, Our Priority</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-transparent py-3 text-sm font-medium text-blue-300 hover:bg-blue-500/10"
          >
            <Share2 className="w-4 h-4" /> Share Receipt
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
        <button
          type="button"
          onClick={handleDownloadImage}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#121a28] py-3 text-sm font-medium text-slate-300 hover:text-white hover:border-blue-500/30"
        >
          <Download className="w-4 h-4" /> Download as Image (PNG)
        </button>

        <Link
          to="/dashboard"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-[#121a28] py-3 text-sm text-slate-300 hover:text-white hover:border-white/20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <p className="text-center text-[10px] text-slate-600 tracking-wide">
          Auxtra Bank · Safe · Simple · Smart
        </p>
      </div>
    );
  }

  // Block transfers until 10% loan fee is settled
  if (loanFeeRequired && pendingLoan) {
    return (
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
        <div className="rounded-2xl bg-blue-600/10 border border-blue-500/20 px-4 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Transfer locked</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Settle the required 10% loan fee before you can send money.
            </p>
          </div>
        </div>
        <LoanFeeNotice
          loanAmount={pendingLoan.amount}
          feeAmount={pendingLoan.fee}
          adminAccountNumber={adminAcct}
          availableBalance={account?.availableBalance}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      {step !== 'form' && (
        <button
          type="button"
          onClick={() => setStep(step === 'pin' ? 'confirm' : 'form')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      {/* Hero header */}
      <div className="rounded-2xl bg-blue-600/10 border border-blue-500/20 px-4 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
          <Send className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Transfer Money</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Move money between accounts or to other banks quickly and securely.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-navy-700 bg-navy-900/60 p-5 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {step === 'form' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Account Number
              </label>
              <div className="relative">
                <input
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      accountNumber: e.target.value.replace(/\D/g, '').slice(0, 12),
                    })
                  }
                  placeholder="Enter recipient account number"
                  className={fieldClass + ' pr-10'}
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
              {lookupStatus === 'loading' && (
                <p className="text-xs text-gray-500 mt-1">Looking up account…</p>
              )}
              {lookupStatus === 'found' && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> {resolvedName}
                </p>
              )}
              {lookupStatus === 'notfound' && form.accountNumber.length >= 8 && (
                <p className="text-xs text-red-400 mt-1">
                  Account number not found. Enter a correct Auxtra Bank account number.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Recipient Name
              </label>
              <div className="relative">
                <input
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="Auto-filled for internal accounts"
                  className={fieldClass + ' pr-10'}
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Bank</label>
              <div className="relative">
                <select
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className={fieldClass + ' appearance-none pr-10'}
                >
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b === HOME_BANK ? `${b} (My Bank)` : b}
                    </option>
                  ))}
                </select>
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Amount ($)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                min="1"
                className={fieldClass}
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {formatCurrency(account?.availableBalance ?? 0)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Description (optional)
              </label>
              <div className="relative">
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Payment for..."
                  className={fieldClass + ' pr-10'}
                />
                <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-blue-600/10 border border-blue-500/20 px-3 py-3 text-xs text-blue-200/90">
              <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              Transfers are processed instantly and securely.
            </div>

            <Button
              onClick={handleNext}
              className="w-full"
              size="lg"
              disabled={loanFeeRequired}
            >
              Continue →
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Confirm Transfer</h3>
            <div className="bg-navy-950/60 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Recipient</span>
                <span className="text-white">{form.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Account</span>
                <span className="text-white font-mono">{form.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">{formatCurrency(amountNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">{formatCurrency(fee)}</span>
              </div>
              <div className="border-t border-navy-700 pt-3 flex justify-between font-semibold">
                <span className="text-gray-300">Total</span>
                <span className="text-blue-400">{formatCurrency(total)}</span>
              </div>
            </div>
            <Button onClick={() => setStep('pin')} className="w-full" size="lg">
              Confirm & Enter PIN
            </Button>
          </div>
        )}

        {step === 'pin' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-center">Authorize transfer</h3>
            <p className="text-sm text-gray-400 text-center">
              Enter your account password and 4-digit transaction PIN to complete this transfer.
            </p>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Account password</label>
              <input
                type="password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="Your login password"
                autoComplete="current-password"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Transaction PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className={fieldClass + ' text-center text-2xl tracking-[0.5em]'}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full" size="lg" loading={loading}>
              Authorize Transfer
            </Button>
            <p className="text-center text-sm text-gray-400">
              Forgot your PIN?{' '}
              <Link to="/settings" className="text-blue-400 hover:text-blue-300 font-medium">
                Reset in Settings
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Promo banner */}
      <div className="rounded-2xl border border-navy-700 bg-navy-900/50 overflow-hidden flex">
        <div className="w-24 sm:w-28 bg-gradient-to-br from-blue-600 to-slate-800 shrink-0 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-white/40" />
        </div>
        <div className="p-4 flex-1">
          <p className="font-semibold text-white text-sm">Bank Smarter · Live Better</p>
          <p className="text-xs text-gray-400 mt-1">Secure. Simple. Always with you.</p>
          <div className="mt-2">
            <WestbridgeLogo size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
