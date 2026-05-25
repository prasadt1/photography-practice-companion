import type { LucideIcon } from 'lucide-react';
import {
  Aperture,
  Home,
  LayoutGrid,
  Layers,
  MessageCircle,
  ScanEye,
  Store,
} from 'lucide-react';
import type { UserMode } from '../types/practice';

export type CoreTab = 'home' | 'studio' | 'memory' | 'mentor';
export type AppTab =
  | CoreTab
  | 'practice'
  | 'triage'
  | 'print'
  | 'field'
  | 'settings';

export interface NavItem {
  id: AppTab;
  label: string;
  icon: LucideIcon;
}

const HOME: NavItem = { id: 'home', label: 'Home', icon: Home };
const STUDIO: NavItem = { id: 'studio', label: 'My Studio', icon: Aperture };
const MEMORY: NavItem = { id: 'memory', label: 'My Work', icon: LayoutGrid };
const FIELD: NavItem = { id: 'field', label: 'Shoot Now', icon: ScanEye };
const MENTOR: NavItem = { id: 'mentor', label: 'Ask Mentor', icon: MessageCircle };
const PRINT: NavItem = { id: 'print', label: 'List for Sale', icon: Store };
const LABEL: NavItem = { id: 'triage', label: 'Label Photos', icon: Layers };

/** Mobile bottom bar — max 4 items (print via Home for working pro). */
export function bottomNavItems(_mode: UserMode): NavItem[] {
  return [HOME, STUDIO, MEMORY, MENTOR];
}

/** Desktop sidebar — working pro gets List for Sale in the rail. */
export function sidebarNavItems(mode: UserMode): NavItem[] {
  if (mode === 'working_pro') {
    return [HOME, STUDIO, MEMORY, FIELD, PRINT, LABEL, MENTOR];
  }
  return [HOME, STUDIO, MEMORY, FIELD, LABEL, MENTOR];
}

export const CORE_TAB_IDS: CoreTab[] = ['home', 'studio', 'memory', 'mentor'];

export function isAppTab(value: string): value is AppTab {
  return [
    'home',
    'studio',
    'memory',
    'mentor',
    'practice',
    'triage',
    'print',
    'field',
    'settings',
  ].includes(value);
}

export function tabFromHash(): AppTab | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash.replace(/^#/, '');
  return raw && isAppTab(raw) ? raw : null;
}

export function setTabHash(tab: AppTab): void {
  if (typeof window === 'undefined') return;
  const next = `#${tab}`;
  if (window.location.hash !== next) {
    window.history.replaceState(null, '', `${window.location.pathname}${next}`);
  }
}
