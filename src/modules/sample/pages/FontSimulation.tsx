import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { availableFonts } from '../../../ui/styles/fonts';

export const FontSimulation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--ui-bg)] p-[var(--spacing-large)]">
      <div className="max-w-4xl mx-auto">
        <header className="mb-[var(--spacing-large)] flex justify-between items-center">
          <div>
            <h1 className="text-[var(--font-size-h1)] font-bold text-[var(--text-base)]">Font Simulation</h1>
            <p className="text-[var(--text-muted)]">Testing typography availability and legibility</p>
          </div>
          <button 
            onClick={() => navigate('/sample')}
            className="px-[var(--spacing-base)] py-[var(--spacing-small)] bg-[var(--ui-primary)] text-white rounded-[var(--radius-sm)] text-[var(--font-size-sm)]"
          >
            Back to Menu
          </button>
        </header>

        <div className="space-y-[var(--spacing-medium)]">
          {availableFonts.map((font) => (
            <motion.div
              key={font.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-[var(--spacing-medium)] bg-[var(--ui-primary)]/5 border border-[var(--ui-primary)]/10 rounded-[var(--radius-base)]"
            >
              <div className="flex justify-between items-center mb-[var(--spacing-small)] border-b border-[var(--ui-primary)]/5 pb-[var(--spacing-nano)]">
                <span className="text-[var(--font-size-xs)] font-bold text-[var(--ui-primary)] tracking-wider">
                  {font.category.toUpperCase()}
                </span>
                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] font-mono">
                  {font.name}
                </span>
              </div>
              
              <div style={{ fontFamily: font.family }}>
                <h2 className="text-[var(--font-size-h2)] font-semibold text-[var(--text-base)] mb-[var(--spacing-nano)]">
                  The quick brown fox jumps over the lazy dog
                </h2>
                <p className="text-[var(--font-size-base)] text-[var(--text-muted)] leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <div className="mt-[var(--spacing-small)] flex gap-[var(--spacing-base)]">
                  <span className="text-[var(--font-size-sm)]">Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz</span>
                  <span className="text-[var(--font-size-sm)]">0123456789 !@#$%^&*()</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FontSimulation;
