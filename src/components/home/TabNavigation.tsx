interface Tab {
  id: 'hotel' | 'experience' | 'dining' | 'pier_ai' | 'flight';
  label: string;
  disabled?: boolean;
}

interface TabNavigationProps {
  activeTab: Tab['id'];
  onTabChange: (tabId: Tab['id']) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: Tab[] = [
    { id: 'hotel', label: 'Hotel' },
    { id: 'experience', label: 'Experience' },
    { id: 'dining', label: 'Dining' },
    { id: 'pier_ai', label: 'Pier AI' },
    { id: 'flight', label: 'Flight (Soon)', disabled: true },
  ];

  return (
    <div className="flex gap-3 mb-8">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          className={`
            px-6 py-3 rounded-full transition-all duration-300
            ${activeTab === tab.id
              ? 'bg-[#c9b896] text-[#0a0a0a] font-medium'
              : tab.disabled
                ? 'bg-[#141414] text-[#a0a0a0]/40 border border-[#2a2a2a] cursor-not-allowed'
                : 'bg-[#141414] text-[#e8e8e8] border border-[#2a2a2a] hover:border-[#3a3a3a]'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

