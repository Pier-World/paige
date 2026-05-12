import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-950 text-white py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h2 className="text-[11px] tracking-[0.3em] uppercase text-white font-medium mb-4">Pier</h2>
            <p className="text-primary-200 text-sm mb-4">
              The personal concierge in your pocket.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-accent-500 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-accent-500 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-accent-500 transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Navigation</h3>
            <ul className="space-y-2 text-primary-200">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/partners" className="hover:text-white transition-colors">Perks</Link>
              </li>
              <li>
                <Link to="/experiences" className="hover:text-white transition-colors">Explore</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition-colors">My Profile</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-primary-200">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Contact</h3>
            <ul className="space-y-2 text-primary-200">
              <li>
                <a href="mailto:concierge@joinpier.com" className="hover:text-white transition-colors">concierge@joinpier.com</a>
              </li>
              <li>
                <a href="https://wa.me/19179354877" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">+1 (917) 935-4877</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-primary-800 text-primary-400 text-sm flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Pier World, Inc. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Crafted with precision for our members.</p>
        </div>
      </div>
    </footer>
  );
};