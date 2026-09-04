'use client';

import { useState } from 'react';

export type TabId = 'overview' | 'personnel' | 'hearings' | 'notes' | 'exhibits' | 'messages';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface CaseTabsProps {
  overview: React.ReactNode;
  personnel: React.ReactNode;
  hearings: React.ReactNode;
  notes: React.ReactNode;
  exhibits: React.ReactNode;
  messages: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden>
        <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    id: 'personnel',
    label: 'Personnel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'hearings',
    label: 'Hearings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'notes',
    label: 'Notes & Updates',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: 'exhibits',
    label: 'Exhibits',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export function CaseTabs({ overview, personnel, hearings, notes, exhibits, messages }: CaseTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto" role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-navy-core text-navy-core'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border',
              ].join(' ')}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="pt-6"
      >
        {activeTab === 'overview' && overview}
        {activeTab === 'personnel' && personnel}
        {activeTab === 'hearings' && hearings}
        {activeTab === 'notes' && notes}
        {activeTab === 'exhibits' && exhibits}
        {activeTab === 'messages' && messages}
      </div>
    </div>
  );
}
