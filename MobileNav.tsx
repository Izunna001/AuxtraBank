import { NavLink } from 'react-router-dom';
import { Home, Wallet, CreditCard, Send } from 'lucide-react';
import { cn } from '../../utils/cn';

const items = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/transfers', icon: Send, label: 'Transfer' },
  { to: '/cards', icon: CreditCard, label: 'Cards' },
];

export function MobileNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur-md border-t border-navy-700/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around min-h-16 px-1 max-w-lg mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 text-[10px] sm:text-[11px] font-medium transition-colors min-h-[56px] min-w-0',
                isActive ? 'text-blue-400' : 'text-gray-500 active:text-gray-300'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-500" />
                )}
                <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'stroke-[2.25]')} />
                <span className="truncate max-w-full">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
