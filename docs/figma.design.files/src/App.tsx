import { useState } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { CalendarPage } from './components/CalendarPage';
import { PerksPage } from './components/PerksPage';
import { MembershipsPage } from './components/MembershipsPage';
import { ExperiencesPage } from './components/ExperiencesPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'perks':
        return <PerksPage />;
      case 'memberships':
        return <MembershipsPage />;
      case 'experiences':
        return <ExperiencesPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}