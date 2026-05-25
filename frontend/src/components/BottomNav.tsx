import React from 'react';
import type { AppTab } from '../config/navConfig';
import { bottomNavItems } from '../config/navConfig';
import type { UserMode } from '../types/practice';

interface Props {
  activeTab: AppTab;
  mode: UserMode;
  onNavigate: (tab: AppTab) => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, mode, onNavigate }) => {
  const items = bottomNavItems(mode);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-warm bg-canvas-elevated/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-stretch h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={item.label}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] text-[10px] font-semibold transition-colors ${
                selected ? 'text-brand-400' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden />
              <span>{item.label.split(' ').pop()}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
