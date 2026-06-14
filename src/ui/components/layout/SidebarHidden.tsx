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

interface SidebarHiddenProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path?: string;
  subMenu?: { label: string; path: string }[];
}

 {/*  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
 { icon: Box, label: 'Sample', path: '/sample' }, */}

const MENU_ITEMS: MenuItem[] = [

  { icon: Signature, label: 'Persetujuan', path: '/persetujuan' },
  
  { 
    icon: ShoppingCart, 
    label: 'Pengadaan', 
    subMenu: [
      { label: 'Pembelian', path: '/pengadaan/pembelian' },
      { label: 'Pengiriman', path: '/pengadaan/pengiriman' },
      { label: 'Suplier', path: '/pengadaan/suplier' },
    ]
  },
  {
    icon: Warehouse,
    label: 'Gudang',
    subMenu: [
      { label: 'Penerimaan', path: '/gudang/penerimaan' },
      { label: 'Pemrosesan', path: '/gudang/pemrosesan' },
      { label: 'Stok Masuk', path: '/gudang/stok-masuk' },
      { label: 'Stok Berjalan', path: '/gudang/stok-berjalan' },
      { label: 'Stok Retur', path: '/gudang/stok-retur' },
      { label: 'Stok Terbuang', path: '/gudang/stok-terbuang' },
    ]
  },
  { icon: ClipboardCheck, label: 'Stok Opname', path: '/stok-opname' },
  {
    icon: Store,
    label: 'Penjualan',
    subMenu: [
      { label: 'Penjualan', path: '/penjualan/penjualan' },
      { label: 'Penyerahan', path: '/penjualan/penyerahan' },
      { label: 'Klaim Retur', path: '/penjualan/klaim-retur' },
      { label: 'Customer', path: '/penjualan/customer' },
    ]
  },
  { icon: Truck, label: 'Pengantaran', path: '/pengantaran' },
  {
    icon: Wallet,
    label: 'Finansial',
    subMenu: [
      { label: 'Kas & Bank', path: '/finansial/kas-bank' },
      { label: 'Pemasukan', path: '/finansial/pemasukan' },
      { label: 'Pengeluaran', path: '/finansial/pengeluaran' },
      { label: 'Piutang', path: '/finansial/piutang' },
      { label: 'Hutang', path: '/finansial/liabilitas' },
      /*{ label: 'Harga Stok', path: '/finansial/modal-stok' },*/
      { label: 'Daftar Harga', path: '/penjualan/daftar-harga' }
    ]
  },
  {
    icon: BarChart3,
    label: 'Laporan',
    subMenu: [
      { label: 'Laporan Penjualan', path: '/laporan/penjualan' },
      { label: 'Laporan Finansial', path: '/laporan/finansial' },
      { label: 'Laporan Produk', path: '/laporan/produk' },
      { label: 'Laporan Pemasaran', path: '/laporan/pemasaran' },
      { label: 'Laporan Customer', path: '/laporan/customer' },
    ]
  },

  { icon: Megaphone, label: 'Pemasaran', path: '/pemasaran' },
  { icon: Megaphone, label: 'Pemasaran', path: '/pemasaran-akun' },
  { icon: Warehouse, label: 'Pemrosesan', path: '/tugas-pemrosesan' },
  { icon: Users, label: 'Akun', path: '/akun' },
];

export const SidebarHidden: React.FC<SidebarHiddenProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { state: { viewport, notifications, sidebarMode, user } } = useGlobalState();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);

  // Filter menu items based on permissions
  const rawFilteredMenuItems = MENU_ITEMS.map(item => {
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
      if (!isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsCollapsed(true);
      }
    }

    // Only auto-collapse on outside click if floating OR if explicitly requested (currently SidebarHidden is designed this way)
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
    if (isCollapsed) return;
    
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

  const sidebarWidth = isCollapsed ? '0rem' : '15rem';
  const { isFloatingSidebar: isFloating } = useGlobalState().state;
  
  return (
    <>
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{ 
          width: sidebarWidth,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "flex flex-col h-full z-[100] select-none bg-White",
          isFloating ? "absolute left-0 top-0 bottom-0 shadow-[15px_0_30px_-5px_rgba(0,0,0,0.3)]" : "relative shadow-[10px_0_16px_-4px_rgba(0,0,0,0.25)]",
          isCollapsed ? "pointer-events-none shadow-none" : "pointer-events-auto rounded-r-[1.5rem]"
        )}
      >
        {/* 
          Toggle Button 
          - Added 'shadow-md' for the sidebar-like shadow.
          - Added group and perspective classes for hover translate-z animation.
        */}
        <div className="absolute right-0 translate-x-full top-10 -translate-y-1/2 perspective-1000 z-[60]">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              // Base styles
              "w-7 h-7 flex items-center justify-center rounded-r-lg rounded-l-none",
              "bg-ColorSecondary text-white cursor-pointer pointer-events-auto",
              // Shadow styles
              "shadow-md hover:shadow-xl", // Shadow added here
              // Transition for smooth animation
              "transition-all duration-300 ease-out",
              // Transform for Hover Effect
              "hover:scale-110 hover:translate-z-12 hover:active:scale-95 active:translate-z-0"
            )}
          >
            {isCollapsed ? <ChevronRight size={15} strokeWidth={2.5} /> : <ChevronLeft size={15} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Inner Container to hold content and handle fade */}
        <motion.div
          animate={{ 
            opacity: isCollapsed ? 0 : 1,
            x: isCollapsed ? '-100%' : '0%',
          }}
          transition={{ 
            duration: 0.3, 
            ease: "easeInOut",
          }}
          className="flex flex-col h-full w-[15rem] overflow-hidden"
        >
          {/* Header / Logo Area */}
          <div className="h-20 flex items-center shrink-0 px-5 justify-between relative">
            <div className="flex items-center gap-3 overflow-visible">
              <div className="w-10 h-10 flex items-center justify-center shrink-0 relative bg-white/40 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm">
                <img 
                  src={appAssets.devBrand} 
                  alt="Logo" 
                  className="w-[34px] h-[34px] object-contain" 
                />
              </div>
              
              <div className="flex flex-col">
                <span className="font-bold text-FontSizeBase leading-tight text-ColorPrimary whitespace-nowrap">
                  {appAssets.DisplayName}
                </span>
                <span className="text-FontSizeNano font-semibold text-Black/80 tracking-widest uppercase mt-0.5 whitespace-nowrap">
                  {appAssets.Branch}
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 pt-5 pb-1 text-xs font-bold text-[#1e3a34]/70 uppercase tracking-wider">
            Menu
          </div>

          {/* Navigation Area */}
          <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
            <ul className="space-y-1 px-3">
              {filteredMenuItems.map((item, index) => {
                const hasSubMenu = !!item.subMenu;
                const isOpen = !!openMenus[item.label];
                const isActive = isItemActive(item);
                
                return (
                  <li key={index} className="relative">
                    <button
                      onClick={() => {
                        if (hasSubMenu) {
                          toggleSubMenu(item.label);
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group",
                        
                        // Text & Hover Colors
                        isActive 
                          ? "text-ColorSecondary font-bold" 
                          : "text-[#1f2937] font-semibold hover:text-ColorSecondary hover:bg-white/40",
                        
                        // Background & Elevation
                        isActive && !hasSubMenu && "bg-white shadow-sm",
                        "hover:shadow-sm",

                        // Elegant Shift Animation
                        "hover:pl-4",

                        // Underline Animation: Left to Right
                        "before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:bg-ColorSecondary before:transition-all before:duration-DurationMid before:ease-in-out",
                        isActive ? "before:w-full" : "before:w-0 group-hover:before:w-full"
                      )}
                    >
                      <item.icon 
                        size={20} 
                        className={cn(
                          "transition-colors duration-DurationMid",
                          isActive ? "text-ColorSecondary" : "text-[#1f2937]"
                        )} 
                      />
                      
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
                          className="text-[#1f2937]/60"
                        >
                          <ChevronDown size={16} />
                        </motion.div>
                      )}
                    </button>

                    {/* Sub-Menu Expanded Mode */}
                    {hasSubMenu && (
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative pl-9 mt-1 space-y-1 overflow-hidden"
                          >
                             <div className="absolute left-[23px] top-0 bottom-3 w-[1.5px] bg-[#1f2937]/20" />

                            {item.subMenu?.map((subItem, subIndex) => {
                              const isSubActive = location.pathname === subItem.path;
                              return (
                                <li key={subIndex} className="relative">
                                  <button
                                    onClick={() => navigate(subItem.path)}
                                    className={cn(
                                      "w-full text-left py-2 px-3 text-sm rounded-lg flex items-center justify-between relative group transition-all duration-DurationMid",
                                      
                                      // Active & Hover State
                                      isSubActive 
                                        ? "text-ColorSecondary font-bold bg-white/80 shadow-sm" 
                                        : "text-[#1f2937]/80 font-semibold hover:text-ColorSecondary hover:bg-white/40",

                                      // Submenu Elegant Shift
                                      "hover:pl-5",

                                      // Smooth Underline for Submenu
                                      "before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[1px] before:bg-ColorSecondary before:transition-all before:duration-DurationMid before:ease-in-out",
                                      isSubActive ? "before:w-full" : "before:w-0 group-hover:before:w-full"
                                    )}
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
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all bg-transparent text-red-600 hover:text-red-700 hover:bg-red-500/10 group relative"
            >
              <LogOut size={20} className="text-red-600" />
              <span className="text-sm font-bold">Keluar</span>
              <span className="absolute bottom-1 left-0 h-[2px] w-0 bg-red-600 transition-all duration-DurationMid group-hover:w-full"></span>
            </button>
          </div>
        </motion.div>
      </motion.aside>

      {/* Floating Sub-Menu Popover (only when NOT collapsed if we follow original logic, but wait, if hidden it shouldn't show popovers) */}
      {/* Tooltips and Popovers removed or disabled if collapsed because sidebar is hidden */}
    </>
  );
};

export default SidebarHidden;