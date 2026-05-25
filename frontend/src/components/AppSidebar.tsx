import React from 'react';
import { Settings } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { AppTab } from '../config/navConfig';
import { sidebarNavItems } from '../config/navConfig';
import type { UserMode } from '../types/practice';

interface Props {
  activeTab: AppTab;
  mode: UserMode;
  onNavigate: (tab: AppTab) => void;
}

export const AppSidebar: React.FC<Props> = ({ activeTab, mode, onNavigate }) => {
  const items = sidebarNavItems(mode);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 shrink-0 border-r border-warm bg-canvas-elevated min-h-screen sticky top-0">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="flex items-center p-5 text-left hover:bg-surface-1 transition-colors border-b border-warm/60"
      >
        <BrandLogo size="md" />
      </button>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selected
                  ? 'bg-brand-500 text-on-brand shadow-md shadow-brand-500/20'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-surface-2'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-warm">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-surface-3 text-white'
              : 'text-stone-400 hover:text-white hover:bg-surface-2'
          }`}
        >
          <Settings className="w-5 h-5" aria-hidden />
          Settings
        </button>
      </div>
    </aside>
  );
};
