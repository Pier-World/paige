import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, CreditCard, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { MemberCard } from '../features/MemberCard';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMemberCardOpen, setIsMemberCardOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMenuOpen(false);
    setIsMemberCardOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleMemberCard = () => setIsMemberCardOpen(!isMemberCardOpen);
  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Perks', path: '/partners' },
    { name: 'Concierge', path: '/concierge' },
    { name: 'Events', path: '/events' },
  ];

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-sm py-3' : 'bg-white/95 backdrop-blur-sm py-5'
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center">
          <img
            src="/Pier Logo Outline v1 1.png"
            alt="Pier Logo"
            className="h-10 w-10"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.path ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center space-x-2 text-sm text-neutral-900 hover:text-neutral-600 transition-colors"
              >
                <User size={18} />
                <span>{user.first_name}</span>
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`ml-1 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2"
                  >
                    <div className="px-4 py-3 border-b border-neutral-200">
                      <p className="text-sm font-medium text-neutral-900">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>
                      <p className="text-xs text-neutral-400 mt-1">{user.membership_level}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <User size={16} />
                      <span>Profile Settings</span>
                    </Link>

                    <Link
                      to="/memberships"
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Membership</span>
                    </Link>

                    <div className="border-t border-neutral-200 my-1"></div>

                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">
                Member Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center space-x-2">
          {user && (
            <button
              className="p-2"
              onClick={toggleMemberCard}
              aria-label="Show member card"
            >
              <CreditCard size={24} />
            </button>
          )}
          <button 
            className="p-2" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white"
          >
            <div className="container-custom py-6 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-base font-medium py-2 ${
                    location.pathname === link.path ? 'text-accent-600' : 'text-primary-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <hr className="border-primary-200 my-2" />
              
              {user ? (
                <>
                  <Link to="/profile" className="flex items-center space-x-2 text-base py-2">
                    <User size={18} />
                    <span>{user.first_name}</span>
                  </Link>
                  <Button variant="ghost" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/login" className="py-2">
                  <Button variant="primary" className="w-full">
                    Member Login
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Member Card Modal */}
      <AnimatePresence>
        {isMemberCardOpen && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={toggleMemberCard}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <MemberCard
                firstName={user.first_name}
                lastName={user.last_name}
                memberId={user.member_id}
                membershipLevel={user.membership_level}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};