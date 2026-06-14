import { IAkunSession, TPeran } from '../types/ITs_Akun.js';
import { MENU_ITEMS } from '../constants/menu.js';

/**
 * Utility to check if a user can access a specific menu or path.
 */
export const canAccessMenu = (user: IAkunSession | null, menuLabel: string, subMenuLabel?: string): boolean => {
  if (!user) return false;

  const { peran, akses_modul } = user;

  // Superadmin has access to everything
  if (user.user_id === '00000000-0000-0000-0000-000000000000') return true;

  // Persetujuan menu check
  if (menuLabel === 'Persetujuan') {
    return !!user.has_invoice_approval;
  }

  // USER role specific restrictions
  if (peran === TPeran.USER) {
    if (menuLabel === 'Dashboard') return true;
    if (menuLabel === 'Pemrosesan' && akses_modul.includes('Pemrosesan')) return true;
    if (menuLabel === 'Pengantaran' && akses_modul.includes('Pengiriman')) return true;
    if (menuLabel === 'Pemasaran' && subMenuLabel === undefined && akses_modul.includes('Marketing')) {
       // Only Pemasaran Personal for USER role
       // Note: In Sidebar, we have two 'Pemasaran' menus (one for personal, one for global)
       // We need to differentiate them. I'll check path in the implementation.
       return true; 
    }
    return false;
  }

  // ADMIN role restrictions
  if (peran === TPeran.ADMIN) {
    if (menuLabel === 'Dashboard') return true;
    if (menuLabel === 'Akun' && akses_modul.includes('Data Akun')) return true;
    
    if (menuLabel === 'Pengadaan' && akses_modul.includes('Pengadaan')) {
      if (subMenuLabel && subMenuLabel.toLowerCase().includes('laporan')) return false;
      return true;
    }

    if (menuLabel === 'Gudang' && akses_modul.includes('Gudang')) return true;
    if (menuLabel === 'Stok Opname' && akses_modul.includes('Stok Opname')) return true;
    
    if (menuLabel === 'Penjualan' && akses_modul.includes('Penjualan')) return true;
    if (menuLabel === 'Finansial' && akses_modul.includes('Finansial')) return true;
    
    if (menuLabel === 'Pemasaran' && akses_modul.includes('Marketing')) return true;
    if (menuLabel === 'Pengantaran' && akses_modul.includes('Pengiriman')) return true;

    if (menuLabel === 'Laporan') {
      if (!subMenuLabel) return true;
      if (subMenuLabel === 'Laporan Produk' && akses_modul.includes('Gudang')) return true;
      if (subMenuLabel === 'Laporan Penjualan' && akses_modul.includes('Penjualan')) return true;
      if (subMenuLabel === 'Laporan Finansial' && akses_modul.includes('Finansial')) return true;
      if (subMenuLabel === 'Laporan Pemasaran' && akses_modul.includes('Marketing')) return true;
      if (subMenuLabel === 'Laporan Customer' && (akses_modul.includes('Marketing') || akses_modul.includes('Penjualan'))) return true;
      return false;
    }
  }

  // GUEST role restrictions
  if (peran === TPeran.GUEST) {
    if (menuLabel === 'Dashboard') return true;
    
    if (menuLabel === 'Laporan') {
      if (!subMenuLabel) return true;
      if (subMenuLabel === 'Laporan Produk' && akses_modul.includes('Produk')) return true;
      if (subMenuLabel === 'Laporan Penjualan' && akses_modul.includes('Penjualan')) return true;
      if (subMenuLabel === 'Laporan Finansial' && akses_modul.includes('Finansial')) return true;
      if (subMenuLabel === 'Laporan Pemasaran' && akses_modul.includes('Marketing')) return true;
      if (subMenuLabel === 'Laporan Customer' && akses_modul.includes('Customer')) return true;
      return false;
    }
    return false;
  }

  return false;
};

/**
 * Utility to check if the current user is in read-only mode (GUEST).
 */
export const isReadOnly = (user: IAkunSession | null): boolean => {
  if (!user) return true;
  return user.peran === TPeran.GUEST;
};

/**
 * Utility to check if a specific path is allowed for the user.
 * This can be used for route protection.
 */
export const isPathAllowed = (user: IAkunSession | null, path: string): boolean => {
  if (!user) return false;
  if (user.user_id === '00000000-0000-0000-0000-000000000000') return true;

  const normalizedPath = path.toLowerCase();

  if (normalizedPath === '/' || normalizedPath === '/dashboard') return true;
  if (normalizedPath === '/persetujuan' || normalizedPath.startsWith('/persetujuan/')) {
    return !!user.has_invoice_approval;
  }
  if (normalizedPath === '/akun' || normalizedPath.startsWith('/akun/')) {
    return user.peran === TPeran.ADMIN && user.akses_modul.includes('Data Akun');
  }

  if (normalizedPath === '/tugas-pemrosesan' || normalizedPath.startsWith('/tugas-pemrosesan/')) {
    return user.peran === TPeran.USER && user.akses_modul.includes('Pemrosesan');
  }

  if (normalizedPath === '/pengantaran' || normalizedPath.startsWith('/pengantaran/')) {
    return user.peran === TPeran.USER && user.akses_modul.includes('Pengiriman');
  }

  if (normalizedPath === '/pemasaran-akun' || normalizedPath.startsWith('/pemasaran-akun/')) {
    return user.peran === TPeran.USER && user.akses_modul.includes('Marketing');
  }

  if (normalizedPath === '/pemasaran' || normalizedPath.startsWith('/pemasaran/')) {
    return (user.peran === TPeran.ADMIN) && user.akses_modul.includes('Marketing');
  }

  if (normalizedPath.startsWith('/pengadaan')) {
    return (user.peran === TPeran.ADMIN) && user.akses_modul.includes('Pengadaan');
  }

  if (normalizedPath.startsWith('/gudang')) {
    return (user.peran === TPeran.ADMIN) && user.akses_modul.includes('Gudang');
  }

  if (normalizedPath === '/stok-opname' || normalizedPath.startsWith('/stok-opname/')) {
    return (user.peran === TPeran.ADMIN && user.akses_modul.includes('Stok Opname'));
  }

  if (normalizedPath.startsWith('/penjualan')) {
    return (user.peran === TPeran.ADMIN) && user.akses_modul.includes('Penjualan');
  }

  if (normalizedPath.startsWith('/finansial')) {
    return (user.peran === TPeran.ADMIN) && user.akses_modul.includes('Finansial');
  }

  if (normalizedPath.startsWith('/laporan')) {
    if (user.peran === TPeran.ADMIN) {
      if (normalizedPath.includes('/produk')) return user.akses_modul.includes('Gudang');
      if (normalizedPath.includes('/penjualan')) return user.akses_modul.includes('Penjualan');
      if (normalizedPath.includes('/finansial')) return user.akses_modul.includes('Finansial');
      if (normalizedPath.includes('/pemasaran')) return user.akses_modul.includes('Marketing');
      if (normalizedPath.includes('/customer')) return user.akses_modul.includes('Marketing') || user.akses_modul.includes('Penjualan');
      return true;
    }
    if (user.peran === TPeran.GUEST) {
      if (normalizedPath.includes('/produk')) return user.akses_modul.includes('Produk');
      if (normalizedPath.includes('/penjualan')) return user.akses_modul.includes('Penjualan');
      if (normalizedPath.includes('/finansial')) return user.akses_modul.includes('Finansial');
      if (normalizedPath.includes('/pemasaran')) return user.akses_modul.includes('Marketing');
      if (normalizedPath.includes('/customer')) return user.akses_modul.includes('Customer');
      return true;
    }
    return false;
  }

  return true; // Default allow for other paths like sample? maybe not.
};

/**
 * Finds the first allowed route based on user roles and permissions.
 */
export const getDefaultRoute = (user: IAkunSession | null): string => {
  if (!user) return '/login';
  if (user.user_id === '00000000-0000-0000-0000-000000000000') return '/';

  for (const item of MENU_ITEMS) {
    // Basic menu item check
    if (item.path && canAccessMenu(user, item.label)) {
      // Specifically avoid Pemasaran Global if current item is Pemasaran with /pemasaran path
      if (item.label === 'Pemasaran' && item.path === '/pemasaran' && user.peran === TPeran.USER) {
        continue;
      }
      return item.path;
    }

    // Sub-menu check
    if (item.subMenu) {
      for (const sub of item.subMenu) {
        if (canAccessMenu(user, item.label, sub.label)) {
          return sub.path;
        }
      }
    }
  }

  return '/';
};
