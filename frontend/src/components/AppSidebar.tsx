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
    <aside className="hidden lg:flex lg:flex-col lg:w-52 shrink-0 border-r border-warm bg-canvas min-h-screen sticky top-0">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="flex items-center p-4 text-left hover:bg-surface-1/50 transition-all duration-200 border-b border-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2"
        style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
      >
        <BrandLogo size="md" />
      </button>

      <nav className="flex-1 px-2 py-3 space-y-1" aria-label="Main navigation">
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
              className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2 ${
                selected
                  ? 'bg-surface-1 text-stone-100 border-l-2 border-brand-400 pl-2.5'
                  : 'text-muted hover:text-stone-200 hover:bg-surface-1/40'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-warm">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          aria-label="Account settings"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2 ${
            activeTab === 'settings'
              ? 'bg-surface-1 text-stone-200 border-l-2 border-brand-400 pl-2.5'
              : 'text-muted hover:text-stone-300 hover:bg-surface-1/40'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
        >
          <Settings className="w-4 h-4" aria-hidden />
          Settings
        </button>
      </div>
    </aside>
  );
};
