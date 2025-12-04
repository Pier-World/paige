import { Menu, User } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'perks', label: 'Perks' },
    { id: 'memberships', label: 'Memberships' },
    { id: 'experiences', label: 'Experiences' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => onNavigate('home')}
            className="tracking-tight hover:opacity-80 transition-opacity" 
            style={{ fontSize: '20px', fontWeight: 300 }}
          >
            Pier
          </button>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`transition-opacity ${
                  currentPage === item.id 
                    ? 'text-[#e8e8e8] opacity-100' 
                    : 'text-[#e8e8e8] opacity-60 hover:opacity-100'
                }`}
                style={{ fontSize: '14px', fontWeight: 300 }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
            <User size={20} className="text-[#e8e8e8]" />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors md:hidden">
            <Menu size={20} className="text-[#e8e8e8]" />
          </button>
        </div>
      </div>
    </header>
  );
}