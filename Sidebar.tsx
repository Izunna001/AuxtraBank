import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Send,
  Receipt,
  PiggyBank,
  HandCoins,
  Bell,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { WestbridgeLogo } from '../ui/WestbridgeLogo';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/cards', icon: CreditCard, label: 'Cards' },
  { to: '/transfers', icon: Send, label: 'Transfers' },
  { to: '/payments', icon: Receipt, label: 'Payments' },
  { to: '/savings', icon: PiggyBank, label: 'Savings' },
  { to: '/loans', icon: HandCoins, label: 'Loans' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { logout, isAdmin, notifications } = useAuth();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-navy-900 border-r border-navy-700/60 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-navy-700/60">
        <WestbridgeLogo size={30} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-800/80'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
            {item.label === 'Notifications' && unread > 0 && (
              <span className="ml-auto bg-blue-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-2',
                isActive
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-800/80'
              )
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-navy-700/60">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
