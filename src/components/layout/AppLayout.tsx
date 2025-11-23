import React from 'react';
import { GlobalNav } from './GlobalNav';

interface AppLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'lg' | 'xl' | '7xl';
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, maxWidth = '7xl' }) => {
  const maxWidthClass = {
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '7xl': 'max-w-7xl'
  }[maxWidth];

  return (
    <div className="min-h-screen bg-white">
      <GlobalNav />
      <main className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {children}
      </main>
    </div>
  );
};
