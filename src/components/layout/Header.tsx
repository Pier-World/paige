import { Menu, User, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  currentPage?: string;
}

export function Header({ currentPage }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'calendar', label: 'Upcoming', path: '/calendar' },
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

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-[11px] tracking-[0.3em] uppercase text-foreground font-medium hover:opacity-80 transition-opacity"
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
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-surface-elevated transition-colors md:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X size={20} className="text-text-primary" />
              ) : (
                <Menu size={20} className="text-text-primary" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Menu Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-background border-l border-border z-50 md:hidden overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 
                    className="text-text-primary"
                    style={{ fontSize: '20px', fontWeight: 300 }}
                  >
                    Menu
                  </h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <X size={20} className="text-text-primary" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1 mb-8">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-surface-elevated text-text-primary'
                          : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                      }`}
                      style={{ fontSize: '15px', fontWeight: 300 }}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* User Section */}
                {user && (
                  <div className="pt-6 border-t border-border">
                    <div className="px-4 py-3 mb-4">
                      <p 
                        className="text-text-secondary mb-1"
                        style={{ fontSize: '12px', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        Account
                      </p>
                      <p 
                        className="text-text-primary"
                        style={{ fontSize: '14px', fontWeight: 400 }}
                      >
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNavClick('/profile')}
                      className="w-full text-left px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                      style={{ fontSize: '15px', fontWeight: 300 }}
                    >
                      Profile Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-surface-elevated transition-colors mt-2"
                      style={{ fontSize: '15px', fontWeight: 300 }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

