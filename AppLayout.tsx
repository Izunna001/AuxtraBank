import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useEffect, useState } from 'react';
import {
  X,
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
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { WestbridgeLogo } from '../ui/WestbridgeLogo';

const mobileMenuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/cards', icon: CreditCard, label: 'Cards' },
  { to: '/transfers', icon: Send, label: 'Transfers' },
  { to: '/payments', icon: Receipt, label: 'Payments' },
  { to: '/savings', icon: PiggyBank, label: 'Savings' },
  { to: '/loans', icon: HandCoins, label: 'Loans' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, isAdmin, notifications } = useAuth();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-navy-950 overflow-x-hidden">
      <Sidebar />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 bottom-0 w-[min(18rem,85vw)] max-w-full bg-navy-900 border-r border-navy-700 animate-slide-in flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-navy-700 shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
              <WestbridgeLogo size={26} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 -mr-1 rounded-xl text-gray-400 hover:text-white hover:bg-navy-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-0.5 min-h-0">
              {mobileMenuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px]',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400'
                        : 'text-gray-400 hover:bg-navy-800'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/notifications' && unread > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </NavLink>
              ))}

              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium mt-2 min-h-[44px]',
                      isActive
                        ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
                        : 'text-purple-300/80 hover:bg-navy-800'
                    )
                  }
                >
                  <Shield className="w-5 h-5 shrink-0" />
                  Admin Panel
                </NavLink>
              )}
            </nav>

            <div className="shrink-0 border-t border-navy-700 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-3 py-3.5 rounded-xl text-sm font-semibold bg-red-500/15 text-red-400 border border-red-500/40 hover:bg-red-500/25 min-h-[48px]"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-64 min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        {/* pb accounts for bottom nav + safe area on mobile */}
        <main className="p-3 xs:p-4 sm:p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6 max-w-7xl mx-auto animate-fade-in min-w-0 w-full">
          <Outlet />
        </main>
      </div>

      {!mobileOpen && <MobileNav />}
    </div>
  );
}
