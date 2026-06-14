import React from 'react';
import { DashboardShell } from '../ui/components/common/shells/DashboardShell';

/**
 * DashboardPage module
 * Displays a simple Coming Soon message wrapped in DashboardShell
 */
export const DashboardPage: React.FC = () => {
  return (
    <DashboardShell 
      title="Dashboard" 
      subtitle="Selamat datang di pusat kendali"
    >
      <div className="flex flex-col items-center justify-center min-h-[50vh] border-BorderMedium border-dashed border-ColorSidebarBorder rounded-RadiusLarge bg-ColorSidebar/opacity-OpacitySubtle">
        <h3 className="text-FontSizeH3 font-bold text-TextColorBase">Coming Soon</h3>
        <p className="text-TextColorMuted mt-SpacingBase">Halaman dashboard sedang dalam tahap pengembangan.</p>
      </div>
    </DashboardShell>
  );
};

export default DashboardPage;
