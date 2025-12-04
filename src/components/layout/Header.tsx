import { Menu, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentPage?: string;
}

export function Header({ currentPage }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'calendar', label: 'Calendar', path: '/calendar' },
    { id: 'perks', label: 'Perks', path: '/perks' },
    { id: 'memberships', label: 'Memberships', path: '/memberships' },
    { id: 'experiences', label: 'Experiences', path: '/experiences' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="tracking-tight hover:opacity-80 transition-opacity"
            style={{ fontSize: '20px', fontWeight: 300 }}
          >
            Pier
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`transition-opacity ${
                  isActive(item.path)
                    ? 'text-text-primary opacity-100'
                    : 'text-text-primary opacity-60 hover:opacity-100'
                }`}
                style={{ fontSize: '14px', fontWeight: 300 }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <User size={20} className="text-text-primary" />
          </Link>
          <button className="p-2 rounded-lg hover:bg-surface-elevated transition-colors md:hidden">
            <Menu size={20} className="text-text-primary" />
          </button>
        </div>
      </div>
    </header>
  );
}

