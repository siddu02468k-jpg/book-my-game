import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { triggerHaptic } from '../utils/device';

export interface BreadcrumbItem {
  label: string;
  tab?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (tab: any) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs">
      <ol className="flex items-center space-x-1 sm:space-x-2 text-slate-400 flex-wrap">
        <li className="flex items-center">
          <button
            onClick={() => {
              triggerHaptic('light');
              onNavigate('home');
            }}
            className="flex items-center space-x-1 hover:text-sport-400 transition"
          >
            <Home className="w-3.5 h-3.5 text-sport-400" />
            <span className="font-semibold">Home</span>
          </button>
        </li>

        {items.map((item, idx) => (
          <li key={idx} className="flex items-center space-x-1 sm:space-x-2">
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            {item.active || !item.tab ? (
              <span className="text-white font-bold truncate max-w-[150px] sm:max-w-[250px]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onNavigate(item.tab);
                }}
                className="hover:text-sport-400 transition font-medium"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
