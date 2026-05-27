import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Building2,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import type { User as PierUser } from '../../types';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Deal Flow', path: '/deals', icon: TrendingUp },
  { label: 'Events', path: '/events', icon: Calendar },
  { label: 'Partners', path: '/partners', icon: Building2 },
  { label: 'Concierge', path: '/concierge', icon: MessageSquare },
  { label: 'Profile', path: '/profile', icon: User },
];

function getDisplayName(user: PierUser | null) {
  if (!user) return 'Member';
  const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.email || 'Member';
}

function getInitials(name: string, email?: string) {
  const source = name !== 'Member' ? name : email || name;
  return source
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName, user?.email) || 'P';

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-parchment">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <span className="font-display text-[24px] leading-none tracking-[-0.02em] text-ink">
            Pier
          </span>
          <span className="rounded-[2px] bg-gilt px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink">
            Members
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="eyebrow mb-3 px-3">Navigation</p>
        <ul className="space-y-0.5">
          {navItems.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex h-9 items-center gap-3 rounded-[6px] px-3 text-[14px] transition-colors duration-150',
                    isActive
                      ? 'bg-ink text-parchment'
                      : 'text-ink/70 hover:bg-ink/[0.05] hover:text-ink'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0 stroke-[1.25]',
                        isActive ? 'text-gilt' : 'text-slate group-hover:text-ink'
                      )}
                    />
                    <span className="flex-1">{label}</span>
                    {isActive ? <ChevronRight className="h-3.5 w-3.5 text-gilt" /> : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-[6px] px-3 py-2 transition-colors hover:bg-ink/[0.05]"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-midnight text-[12px] font-medium text-parchment">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{displayName}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 flex h-9 w-full items-center gap-3 rounded-[6px] px-3 text-left text-[14px] text-slate transition-colors hover:bg-ink/[0.05] hover:text-ink"
        >
          <LogOut className="h-4 w-4 stroke-[1.25]" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function CapitalMarketsSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <aside className="hidden h-screen w-[240px] flex-shrink-0 lg:flex">
        <SidebarContent />
      </aside>

      <div className="lg:hidden">
        <div className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-parchment px-4">
          <Link to="/dashboard" className="font-display text-[22px] leading-none text-ink">
            Pier
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-border text-ink"
            aria-label="Open navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 bg-ink/40" onClick={() => setMobileOpen(false)}>
            <aside
              className="h-full w-[280px] max-w-[85vw]"
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}
