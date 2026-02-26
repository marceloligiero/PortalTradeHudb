// Componente: Tabs Moderno
import React, { useState } from 'react';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'line' | 'pill' | 'box';
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'line',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className={clsx(
        'flex gap-2 p-1 rounded-xl',
        variant === 'box' && 'bg-white/5 border border-white/10'
      )}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-red-500/50',
              activeTab === tab.id
                ? variant === 'pill' 
                  ? 'bg-red-600 text-white'
                  : variant === 'box'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white border-b-2 border-red-600 bg-transparent'
                : variant === 'box'
                ? 'text-white/70 hover:text-white'
                : 'text-white/70 hover:text-white border-b-2 border-transparent'
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 bg-red-600/20 text-red-300 text-xs rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
