import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';

interface Tab {
  id: string | number;
  label: string | React.ReactNode;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string | number;
  onChange: (id: string | number) => void;
  className?: string;
  variant?: 'pills' | 'underline' | 'segmented';
  id?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'pills',
  id = "tabs"
}) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  return (
    <div 
      id={id}
      className={cn(
        "flex items-center gap-4 overflow-x-auto scrollbar-hide relative w-full",
        variant === 'segmented' && "bg-gray-100 p-1 rounded-lg",
        variant === 'underline' && "border-b border-gray-200", 
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const tabId = `${id}-item-${tab.id}`;

        return (
          <button
            key={tab.id}
            id={tabId}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-2 font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              isMobile ? "text-sm" : "text-base",
              isActive ? "text-ColorPrimary" : "text-gray-500 hover:text-gray-800"
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>

            {/* 
              GARIS BAWAH AKTIF (UNDERLINE)
              - h-[0.25rem] = 4px (Menggunakan satuan rem/konfigurasi tailwind, bukan pixel hardcoded)
              - bg-ColorPrimary = Menggunakan variabel warna dari tokens.ts
            */}
            {isActive && variant === 'underline' && (
              <motion.div
                layoutId={`active-tab-${id}`}
                className="absolute bottom-0 left-0 right-0 bg-ColorPrimary z-10"
                style={{ height: '0.25rem' }} 
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};