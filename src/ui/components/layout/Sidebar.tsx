import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard,
  Users,
  Box,
  ShoppingCart,
  Store,
  Wallet,
  ClipboardCheck,
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  LogOut,
  Warehouse,
  Megaphone,
  BarChart3,
  Signature,
  Truck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { cn } from '../../../logic/utils/cn';
import { appAssets } from '../../styles/assets';
import { authService } from '../../../logic/services/authService';
import { NotificationBadge } from '../elements/NotificationBadge';
import { IAkunSession, TPeran } from '../../../logic/types/ITs_Akun';
import { canAccessMenu } from '../../../logic/utils/auth';
import { MENU_ITEMS, MenuItem } from '../../../logic/constants/menu';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { state: { viewport, notifications, sidebarMode, user } } = useGlobalState();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);

  // Filter menu items based on permissions
  const rawFilteredMenuItems = MENU_ITEMS.map(item => {
    // Return a shallow copy if it has a subMenu to avoid mutating the original MENU_ITEMS
    const clonedItem = { ...item };
    if (clonedItem.subMenu) {
      clonedItem.subMenu = clonedItem.subMenu.filter(sub => canAccessMenu(user, item.label, sub.label));
    }
    return clonedItem;
  }).filter(item => {
    // Special check for Pemasaran duplicate labels
    if (item.label === 'Pemasaran') {
      if (item.path === '/pemasaran-akun') {
        // Pemasaran Personal
        return user?.peran === TPeran.USER && user?.akses_modul.includes('Marketing');
      }
      if (item.path === '/pemasaran') {
        // Pemasaran Global - Guest should NOT be able to access main Pemasaran menu
        return user?.peran === TPeran.ADMIN && user?.akses_modul.includes('Marketing');
      }
    }

    const hasAccess = canAccessMenu(user, item.label);
    if (!hasAccess) return false;

    // If it has subMenu, ensure it has at least one accessible child
    if (item.subMenu) {
      return item.subMenu.length > 0;
    }

    return true;
  });

  // Specifically for GUEST role, flatten the 'Laporan' menu items as main menu items.
  const filteredMenuItems: MenuItem[] = [];
  if (user?.peran === TPeran.GUEST) {
    rawFilteredMenuItems.forEach(item => {
      if (item.label === 'Laporan' && item.subMenu) {
        item.subMenu.forEach(sub => {
          filteredMenuItems.push({
            icon: BarChart3,
            label: sub.label,
            path: sub.path
          });
        });
      } else {
        filteredMenuItems.push(item);
      }
    });
  } else {
    filteredMenuItems.push(...rawFilteredMenuItems);
  }

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [popoverData, setPopoverData] = useState<{
    label: string;
    subMenu: { label: string; path: string }[];
    top: number;
    left: number;
  } | null>(null);

  const [tooltipData, setTooltipData] = useState<{
    label: string;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If expanded and click is outside, collapse it
      if (!isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsCollapsed(true);
      }
    }

    // Only add listener if sidebar is expanded
    if (!isCollapsed) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCollapsed, setIsCollapsed]);

  const toggleSubMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isItemActive = (item: MenuItem) => {
    if (item.path) return location.pathname === item.path;
    if (item.subMenu) return item.subMenu.some(sub => location.pathname === sub.path);
    return false;
  };

  const handleItemMouseEnter = (e: React.MouseEvent, item: MenuItem) => {
    if (!isCollapsed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (item.subMenu) {
      setPopoverData({
        label: item.label,
        subMenu: item.subMenu,
        top: rect.top,
        left: rect.right, 
      });
    } else {
      setTooltipData({
        label: item.label,
        top: rect.top + (rect.height / 2) - 18,
        left: rect.right + 6, 
      });
    }
  };

  const handleItemMouseLeave = () => {
    setPopoverData(null);
    setTooltipData(null);
  };

  const sidebarWidth = isCollapsed ? '4.5rem' : '15rem';
  const { isFloatingSidebar: isFloating } = useGlobalState().state;
  
  return (
    <>
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "flex flex-col h-full z-[100] select-none rounded-r-[1.5rem] bg-[linear-gradient(120deg,#ffffff_33.3%,#4AC29A_75%,#BDFFF3_100%)]",
          isFloating ? "absolute left-0 top-0 bottom-0 shadow-[15px_0_30px_-5px_rgba(0,0,0,0.3)]" : "relative shadow-[10px_0_16px_-4px_rgba(0,0,0,0.25)]"
        )}
      >
        {/* Header / Logo Area */}
        <div className={`h-20 flex items-center shrink-0 relative ${
          isCollapsed ? "justify-center px-0" : "px-5 justify-between"
        }`}>
          <div className="flex items-center gap-3 overflow-visible">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 relative bg-white/40 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm">
              <img 
                src={appAssets.devBrand} 
                alt="Logo" 
                className="w-[34px] h-[34px] object-contain" 
              />
            </div>
            
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="font-bold text-FontSizeBase leading-tight text-[#1f2937] whitespace-nowrap">
                  {appAssets.DisplayName}
                </span>
                <span className="text-FontSizeNano font-semibold text-[#1e3a34]/60 tracking-widest uppercase mt-0.5 whitespace-nowrap">
                  {appAssets.Branch}
                </span>
              </motion.div>
            )}
          </div>

          {/* Toggle Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute right-0 translate-x-full top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-r-lg rounded-l-none bg-ColorSecondary text-white hover:bg-ColorSecondary hover:brightness-95 transition-colors shadow-md z-50 cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={15} strokeWidth={2.5} /> : <ChevronLeft size={15} strokeWidth={2.5} />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-5 pt-5 pb-1 text-xs font-bold text-[#1e3a34]/70 uppercase tracking-wider">
            Menu
          </div>
        )}

        {/* Navigation Area */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <ul className="space-y-1 px-3">
            {filteredMenuItems.map((item, index) => {
              const hasSubMenu = !!item.subMenu;
              const isOpen = !!openMenus[item.label];
              const isActive = isItemActive(item);
              
              return (
                <li 
                  key={index}
                  onMouseEnter={(e) => handleItemMouseEnter(e, item)}
                  onMouseLeave={handleItemMouseLeave}
                  className="relative"
                >
                  <button
                    onClick={() => {
                      if (hasSubMenu) {
                        if (isCollapsed) {
                          setIsCollapsed(false);
                          setOpenMenus(prev => ({ ...prev, [item.label]: true }));
                        } else {
                          toggleSubMenu(item.label);
                        }
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative ${
                      isActive && !hasSubMenu
                        ? "bg-white text-[#1e3a34] font-bold shadow-sm" 
                        : "text-[#1e3a34] font-semibold hover:bg-white/40 hover:text-[#000000]"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  >
                    <item.icon 
                      size={20} 
                      className="text-[#1e3a34]" 
                    />
                    
                    {isCollapsed && item.label === 'Pengadaan' && notifications.dropshipCount > 0 && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse shadow-sm" />
                    )}

                    {isCollapsed && item.label === 'Finansial' && notifications.expenseRequestCount > 0 && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse shadow-sm" />
                    )}
                    
                    {isCollapsed && item.label === 'Finansial' && notifications.incomeRequestCount > 0 && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse shadow-sm" />
                    )}
                    
                    {isCollapsed && item.label === 'Gudang' && notifications.queueStokMasukCount > 0 && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse shadow-sm" />
                    )}

                    {isCollapsed && item.label === 'Persetujuan' && notifications.persetujuanCount > 0 && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse shadow-sm" />
                    )}
                    
                    {!isCollapsed && (
                      <>
                        <span className="text-sm flex-1 text-left flex items-center gap-2">
                          {item.label}
                          {item.label === 'Pengadaan' && notifications.dropshipCount > 0 && (
                            <div className="w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse" />
                          )}
                          {item.label === 'Gudang' && notifications.queueStokMasukCount > 0 && (
                            <div className="w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse" />
                          )}
                          {item.label === 'Finansial' && notifications.expenseRequestCount > 0 && (
                            <div className="w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse" />
                          )}
                          {item.label === 'Finansial' && notifications.incomeRequestCount > 0 && (
                            <div className="w-2 h-2 bg-FeedbackColorError rounded-full animate-pulse" />
                          )}
                        </span>
                        {item.label === 'Persetujuan' && notifications.persetujuanCount > 0 && (
                          <NotificationBadge count={notifications.persetujuanCount} className="scale-75" />
                        )}
                        {hasSubMenu && (
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-[#1e3a34]/60"
                          >
                            <ChevronDown size={16} />
                          </motion.div>
                        )}
                      </>
                    )}
                  </button>

                  {/* Sub-Menu Expanded Mode */}
                  {!isCollapsed && hasSubMenu && (
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="relative pl-9 mt-1 space-y-1 overflow-hidden"
                        >
                          {/* Garis Vertikal */}
                          <div className="absolute left-[23px] top-0 bottom-3 w-[1.5px] bg-[#1e3a34]/20" />

                          {item.subMenu?.map((subItem, subIndex) => {
                            const isSubActive = location.pathname === subItem.path;
                            return (
                              <li key={subIndex} className="relative">
                                <button
                                  onClick={() => navigate(subItem.path)}
                                  className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-between relative ${
                                    isSubActive 
                                      ? "text-[#1e3a34] font-bold bg-white/80 shadow-sm" 
                                      : "text-[#1e3a34]/80 font-semibold hover:text-[#000000] hover:bg-white/30"
                                  }`}
                                >
                                  <span>{subItem.label}</span>
                                  {subItem.label === 'Pembelian' && notifications.dropshipCount > 0 && (
                                    <NotificationBadge count={notifications.dropshipCount} className="scale-75" />
                                  )}
                                  {subItem.label === 'Stok Masuk' && notifications.queueStokMasukCount > 0 && (
                                    <NotificationBadge count={notifications.queueStokMasukCount} className="scale-75" />
                                  )}
                                  {subItem.label === 'Pengeluaran' && notifications.expenseRequestCount > 0 && (
                                    <NotificationBadge count={notifications.expenseRequestCount} className="scale-75" />
                                  )}
                                  {subItem.label === 'Pemasukan' && notifications.incomeRequestCount > 0 && (
                                    <NotificationBadge count={notifications.incomeRequestCount} className="scale-75" />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Area */}
        <div className="p-3 shrink-0">
          <button
            onClick={() => authService.logout()}
            onMouseEnter={(e) => handleItemMouseEnter(e, { icon: LogOut, label: 'Keluar' })}
            onMouseLeave={handleItemMouseLeave}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all bg-transparent text-red-600 hover:text-red-700 hover:bg-red-500/10 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={20} className="text-red-600" />
            {!isCollapsed && <span className="text-sm font-bold">Keluar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Floating Sub-Menu Popover saat Collapsed */}
      {createPortal(
        <AnimatePresence>
          {isCollapsed && popoverData && (
            <div
              style={{ top: popoverData.top, left: popoverData.left }}
              className="fixed z-50 min-w-[180px] p-2 pointer-events-auto"
              onMouseEnter={() => setPopoverData(popoverData)}
              onMouseLeave={handleItemMouseLeave}
            >
              <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),_0_8px_10px_-6px_rgba(0,0,0,0.1)] py-1.5 overflow-hidden">
                <div className="px-3.5 py-2 text-xs font-bold text-[#9ca3af] uppercase tracking-wider border-b border-[#f3f4f6] mb-1">
                  {popoverData.label}
                </div>
                
                <ul className="space-y-0.5 px-1.5">
                  {popoverData.subMenu.map((subItem, idx) => {
                    const isSubActive = location.pathname === subItem.path;
                    return (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            navigate(subItem.path);
                            setPopoverData(null);
                          }}
                          className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-between ${
                            isSubActive 
                              ? "bg-[#eff6ff] text-[#1d4ed8] font-semibold" 
                              : "text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827]"
                          }`}
                        >
                          <span>{subItem.label}</span>
                          {subItem.label === 'Pembelian' && notifications.dropshipCount > 0 && (
                            <NotificationBadge count={notifications.dropshipCount} className="scale-75" />
                          )}
                          {subItem.label === 'Stok Masuk' && notifications.queueStokMasukCount > 0 && (
                            <NotificationBadge count={notifications.queueStokMasukCount} className="scale-75" />
                          )}
                          {subItem.label === 'Pengeluaran' && notifications.expenseRequestCount > 0 && (
                            <NotificationBadge count={notifications.expenseRequestCount} className="scale-75" />
                          )}
                          {subItem.label === 'Pemasukan' && notifications.incomeRequestCount > 0 && (
                            <NotificationBadge count={notifications.incomeRequestCount} className="scale-75" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Tooltip untuk Menu Tanpa Sub-Menu & Logout saat Collapsed */}
      {createPortal(
        <AnimatePresence>
          {isCollapsed && tooltipData && (
            <div
              style={{ top: tooltipData.top, left: tooltipData.left }}
              className="fixed z-50 bg-white border border-[#e5e7eb] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] py-2 px-3.5 pointer-events-none flex items-center h-[36px]"
            >
              <span className={`text-xs font-bold uppercase tracking-wider ${
                tooltipData.label === 'Keluar' ? 'text-red-600' : 'text-[#4b5563]'
              }`}>
                {tooltipData.label}
              </span>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Sidebar;