import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import { PiggyBank, Plus } from 'lucide-react';

export default function Savings() {
  const { savingsGoals, createSavingsGoal, addToSavings, account } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [addAmount, setAddAmount] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !target || !deadline) return;
    setLoading(true);
    await createSavingsGoal({ name, targetAmount: parseFloat(target), deadline });
    setName(''); setTarget(''); setDeadline('');
    setShowForm(false);
    setLoading(false);
  };

  const handleAdd = async (goalId: string) => {
    const amt = parseFloat(addAmount[goalId] || '0');
    if (amt <= 0) return;
    setLoading(true);
    try {
      await addToSavings(goalId, amt);
      setAddAmount({ ...addAmount, [goalId]: '' });
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Savings Goals</h1>
          <p className="text-gray-400 text-sm mt-1">Track and grow your savings</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4" /> New Goal
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-4">
          <Input label="Goal Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency Fund" />
          <Input label="Target Amount ($)" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <Button onClick={handleCreate} loading={loading}>Create Goal</Button>
        </Card>
      )}

      {savingsGoals.length === 0 && !showForm ? (
        <Card className="text-center py-12">
          <PiggyBank className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-1">No savings goals yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create one to start building towards your dreams</p>
          <Button onClick={() => setShowForm(true)}>Create First Goal</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {savingsGoals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            return (
              <Card key={goal.id}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-white">{goal.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${goal.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {goal.status}
                  </span>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(goal.currentAmount)} <span className="text-sm font-normal text-gray-400">/ {formatCurrency(goal.targetAmount)}</span></p>
                <div className="mt-3 h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{pct}% complete · Deadline {new Date(goal.deadline).toLocaleDateString()}</p>
                {goal.status === 'active' && (
                  <div className="flex gap-2 mt-4">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={addAmount[goal.id] || ''}
                      onChange={(e) => setAddAmount({ ...addAmount, [goal.id]: e.target.value })}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleAdd(goal.id)} loading={loading}>Add</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
