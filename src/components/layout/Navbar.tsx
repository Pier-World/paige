import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { MemberCard } from '../features/MemberCard';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMemberCardOpen, setIsMemberCardOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

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
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleMemberCard = () => setIsMemberCardOpen(!isMemberCardOpen);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Perks', path: '/perks' },
    { name: 'Travel', path: '/travel' },
    { name: 'Events', path: '/explore' },
  ];

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-sm py-3' : 'bg-white/95 backdrop-blur-sm py-5'
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        <Link to="/" className="flex items-center">
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
            <>
              <button className="flex items-center space-x-2 text-sm text-neutral-900 hover:text-neutral-600 transition-colors">
                <User size={18} />
                <span>{user.first_name}</span>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
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