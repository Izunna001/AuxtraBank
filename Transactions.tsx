import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../utils/format';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Search, Filter } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Transactions() {
  const { transactions } = useAuth();
  const { id } = useParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const filtered = transactions.filter((tx) => {
    const matchSearch =
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || tx.type === filter;
    return matchSearch && matchFilter;
  });

  if (id) {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return <p className="text-gray-400">Transaction not found</p>;
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <Card className="space-y-4">
          <div className="text-center border-b border-navy-700 pb-4">
            <p className="text-sm text-gray-400">Transaction Receipt</p>
            <p className={`text-3xl font-bold mt-2 ${tx.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${tx.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
              {tx.status}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Description</span><span className="text-white text-right max-w-[60%]">{tx.description}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Reference</span><span className="text-blue-400 font-mono text-xs">{tx.reference}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Date</span><span className="text-white">{format(new Date(tx.createdAt), 'PPpp')}</span></div>
            {tx.recipientName && <div className="flex justify-between"><span className="text-gray-400">Recipient</span><span className="text-white">{tx.recipientName}</span></div>}
            {tx.fee ? <div className="flex justify-between"><span className="text-gray-400">Fee</span><span className="text-white">{formatCurrency(tx.fee)}</span></div> : null}
          </div>
          <Button variant="outline" className="w-full" onClick={() => window.print()}>Download / Print</Button>
          <Link to="/transactions"><Button variant="ghost" className="w-full">Back to list</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-gray-400 text-sm mt-1">View and filter your transaction history</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description or reference..."
            className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'credit', 'debit'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-sm font-medium capitalize ${filter === f ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-navy-800 text-gray-400 border border-navy-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none">
        <div className="divide-y divide-navy-700/50">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No transactions found</p>
          ) : (
            filtered.map((tx) => (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-navy-700/30 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                  {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm a')} · {tx.status}</p>
                </div>
                <p className={`text-sm font-semibold tabular-nums ${tx.type === 'credit' ? 'text-emerald-400' : 'text-gray-200'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
