import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { appAssets } from '../../../ui/styles/assets';
import { Eye, Smartphone, Globe, User } from 'lucide-react';

export const IconVisualization: React.FC = () => {
  const navigate = useNavigate();
  const [bgType, setBgType] = useState<'light' | 'dark' | 'transparent'>('transparent');

  const bgClasses = {
    light: 'bg-white',
    dark: 'bg-slate-900',
    transparent: 'bg-[url("https://www.transparenttextures.com/patterns/checkerboard.png")] bg-gray-100',
  };

  const icons = [
    { title: 'Browser Favicon / PWA', link: appAssets.favicon, icon: Globe, desc: 'Used for tab and homescreen shortcut' },
    { title: 'Main App Icon', link: appAssets.appIcon, icon: Smartphone, desc: 'Main logo for your application' },
    { title: 'Developer Brand', link: appAssets.devBrand, icon: User, desc: 'Your personal or agency branding' },
  ];

  return (
    <div className="min-h-screen bg-[var(--ui-bg)] p-[var(--spacing-large)]">
      <div className="max-w-4xl mx-auto">
        <header className="mb-[var(--spacing-large)] flex justify-between items-center px-[var(--spacing-small)]">
          <div>
            <h1 className="text-[var(--font-size-h1)] font-bold text-[var(--text-base)]">Icon Visualization</h1>
            <p className="text-[var(--text-muted)]">Check how your icons look on different backgrounds</p>
          </div>
          <button 
            onClick={() => navigate('/sample')}
            className="px-[var(--spacing-base)] py-[var(--spacing-small)] bg-[var(--ui-primary)] text-white rounded-[var(--radius-sm)] text-[var(--font-size-sm)] font-medium"
          >
            Back to Menu
          </button>
        </header>

        {/* Background Selector */}
        <div className="flex gap-2 mb-[var(--spacing-medium)] bg-[var(--ui-primary)]/5 p-2 rounded-[var(--radius-base)] max-w-fit">
          <button 
            onClick={() => setBgType('light')}
            className={`px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${bgType === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-[var(--text-muted)]'}`}
          >
            Light
          </button>
          <button 
            onClick={() => setBgType('dark')}
            className={`px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${bgType === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
          >
            Dark
          </button>
          <button 
            onClick={() => setBgType('transparent')}
            className={`px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${bgType === 'transparent' ? 'bg-[var(--ui-primary)] text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
          >
            Transparent
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-large)]">
          {icons.map((item) => (
            <div key={item.title} className="flex flex-col gap-[var(--spacing-small)]">
              <div className="flex items-center gap-2 text-[var(--text-base)]">
                <item.icon className="w-4 h-4 text-[var(--ui-primary)]" />
                <h3 className="font-bold text-[var(--font-size-base)]">{item.title}</h3>
              </div>
              
              <motion.div 
                layout
                className={`aspect-square w-full rounded-[var(--radius-large)] border border-[var(--ui-primary)]/10 flex items-center justify-center p-12 relative overflow-hidden ${bgClasses[bgType]}`}
              >
                <img 
                  src={item.link} 
                  alt={item.title} 
                  className="w-32 h-32 object-contain drop-shadow-xl"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              
              <div className="flex flex-col gap-1">
                 <p className="text-[var(--font-size-xs)] text-[var(--text-muted)]">{item.desc}</p>
                 <code className="text-[10px] bg-[var(--ui-primary)]/5 p-1 rounded truncate text-[var(--ui-primary)]">
                    {item.link}
                 </code>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[var(--spacing-huge)] p-[var(--spacing-medium)] bg-blue-500/5 border border-blue-500/10 rounded-[var(--radius-base)]">
            <h4 className="text-[var(--font-size-sm)] font-bold text-blue-500 mb-2">Pro Tip</h4>
            <p className="text-[var(--font-size-xs)] text-[var(--text-muted)] leading-relaxed">
                Icons defined in <code className="text-blue-500 font-bold">assets.ts</code> are the source of truth. Changing the link there will update the simulation and the actual browser favicon dynamically. Ensure your image has a transparent background (PNG/SVG) for the best look.
            </p>
        </div>
      </div>
    </div>
  );
};

export default IconVisualization;
