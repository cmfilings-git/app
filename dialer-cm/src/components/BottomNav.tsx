import React from 'react';
import { Users, Grip, CheckSquare, Menu } from 'lucide-react';
import { NavigationTab } from '../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  pendingTaskCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingTaskCount,
}) => {
  const items: { id: NavigationTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Users className="w-[18px] h-[18px]" strokeWidth={activeTab === 'contacts' ? 2.25 : 1.75} />,
    },
    {
      id: 'dialer',
      label: 'Dialer',
      icon: <Grip className="w-[18px] h-[18px]" strokeWidth={activeTab === 'dialer' ? 2.25 : 1.75} />,
    },
    {
      id: 'task',
      label: 'Task',
      icon: <CheckSquare className="w-[18px] h-[18px]" strokeWidth={activeTab === 'task' ? 2.25 : 1.75} />,
      count: pendingTaskCount > 0 ? pendingTaskCount : undefined,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: <Menu className="w-[18px] h-[18px]" strokeWidth={activeTab === 'menu' ? 2.25 : 1.75} />,
    },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-4 h-14">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocean-700 ${
                isActive
                  ? 'text-ocean-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-ocean-700 rounded-full"
                />
              )}
              <span className="relative flex items-center justify-center">
                {item.icon}
                {item.count !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 px-1 text-[9px] font-semibold leading-[14px] text-center rounded-full bg-ocean-700 text-white tabular-nums">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </span>
              <span className={`text-[10px] leading-none whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
