import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useGlobalState } from '../../logic/context/GlobalContext';
import { SidebarHidden } from '../components/layout/SidebarHidden';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { motion } from 'motion/react';
import { cn } from '../../logic/utils/cn';
import { authService } from '../../logic/services/authService';

/**
 * MainAppLayout
 * Starter wrapper/layout polosan untuk pengembangan aplikasi.
 * Memiliki Sidebar (Collapsible), Header, Footer, dan Content Area yang proporsional.
 */
import { isPathAllowed } from '../../logic/utils/auth';

export const MainAppLayout: React.FC = () => {
  const { state, setSidebarCollapsed } = useGlobalState();
  const { viewport, user, isSidebarCollapsed } = state;
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsed by default on mobile/compact
  useEffect(() => {
    if (viewport.isCompact) {
      setSidebarCollapsed(true);
    }
  }, [viewport.isCompact]);

  // AUTH GUARD & ROLE GUARD
  useEffect(() => {
    if (!user && !authService.isAuthenticated()) {
      navigate('/login');
    } else if (user && !isPathAllowed(user, location.pathname)) {
      // Redirect to dashboard if path is not allowed for current role/modules
      navigate('/');
    }
  }, [user, navigate, location.pathname]);

  if (!user && !authService.isAuthenticated()) {
    return null; // Don't render layout if not authenticated
  }

  // Layout logic:
  // Desktop: Sidebar (left) + Header/Content/Footer (right)
  // Mobile: Drawer sidebar (palsu/polosan) or hidden.
  
  return (
    <div className="relative flex h-screen overflow-hidden bg-ColorBgSecondary/opacity-OpacityNano text-TextColorBase">
      {/* Sidebar - Persistent but can be collapsed/hidden */}
      <SidebarHidden 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setSidebarCollapsed} 
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header (Fixed at top of content area) */}
        <div className={cn(
          "bg-White border-b border-black/5 transition-all duration-DurationMid shadow-ElevationSm",
          viewport.isMobile ? "px-SpacingBase" : (viewport.isTablet ? "px-SpacingMedium" : "px-SpacingMedium")
        )}>
          <div className="w-full max-w-7xl mx-auto">
            <Header />
          </div>
        </div>

        {/* Content Area */}
        <main className={cn(
          "flex-1 flex flex-col overflow-y-auto scrollbar-hide transition-all duration-DurationMid",
          viewport.isMobile ? "py-SpacingBase" : "py-SpacingBase"
        )}>
          <div className={cn(
            "w-full max-w-7xl mx-auto flex-1 flex flex-col transition-all duration-DurationMid",
            viewport.isMobile ? "px-SpacingBase" : (viewport.isTablet ? "px-SpacingMedium" : "px-SpacingMedium")
          )}>
            <Outlet />
          </div>
        </main>

        {/* Footer (Fixed at bottom of main container) */}
        <div className={cn(
          "bg-ColorBg border-t border-black/5 transition-all duration-DurationMid",
          viewport.isMobile ? "px-SpacingBase" : (viewport.isTablet ? "px-SpacingMedium" : "px-SpacingMedium")
        )}>
          <div className="w-full max-w-7xl mx-auto">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainAppLayout;
