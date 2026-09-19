import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { WestbridgeLogo } from '../ui/WestbridgeLogo';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, notifications } = useAuth();
  const unread = notifications.filter((n) => !n.read).length;
  const [search, setSearch] = useState('');

  return (
    <header className="sticky top-0 z-30 bg-navy-900/90 backdrop-blur-md border-b border-navy-700/50 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 sm:gap-3 max-w-7xl mx-auto min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2.5 -ml-1 rounded-xl text-gray-400 hover:bg-navy-800 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center shrink-0 lg:hidden min-w-0">
          <WestbridgeLogo size={22} className="max-[360px]:[&_span]:hidden" />
        </Link>

        <div className="flex-1 max-w-md relative hidden md:block min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="search"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-800/80 border border-navy-700 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
          <Link
            to="/notifications"
            className="relative p-2.5 rounded-xl text-gray-400 hover:bg-navy-800 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-navy-800 transition-colors"
            aria-label="Profile"
          >
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden ring-2 ring-navy-800">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="hidden xl:block text-left leading-tight pr-1">
              <p className="text-xs font-semibold text-white truncate max-w-[8rem]">
                {user?.fullName?.split(' ')[0] || 'User'}
              </p>
              <p className="text-[10px] text-gray-500">
                {user?.role === 'admin' ? 'Administrator' : 'Customer'}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
