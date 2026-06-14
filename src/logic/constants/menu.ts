import { 
  LayoutDashboard,
  Users,
  ShoppingCart,
  Store,
  Wallet,
  ClipboardCheck,
  Warehouse,
  Megaphone,
  BarChart3,
  Signature,
  Truck,
  Box
} from 'lucide-react';
import React from 'react';

/**
 * Interface for Navigation Menu items
 */
export interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path?: string;
  subMenu?: { label: string; path: string }[];
}

/**
 * Main Navigation Menu Items Definition
 * This is the single source of truth for the application menu.
 */
export const MENU_ITEMS: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Akun', path: '/akun' },
  { icon: Megaphone, label: 'Pemasaran', path: '/pemasaran' },
  { icon: Megaphone, label: 'Pemasaran', path: '/pemasaran-akun' },
  { icon: Warehouse, label: 'Pemrosesan', path: '/tugas-pemrosesan' },
  { icon: Signature, label: 'Persetujuan', path: '/persetujuan' },
  { icon: Box, label: 'Sample', path: '/sample' },
  { 
    icon: ShoppingCart, 
    label: 'Pengadaan', 
    subMenu: [
      { label: 'Suplier', path: '/pengadaan/suplier' },
      { label: 'Pembelian', path: '/pengadaan/pembelian' },
      { label: 'Pengiriman', path: '/pengadaan/pengiriman' },
      { label: 'TestPage_Suplier', path: '/pengadaan/suplier/test' }
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
      { label: 'Customer', path: '/penjualan/customer' },
      { label: 'Penjualan', path: '/penjualan/penjualan' },
      { label: 'Penyerahan', path: '/penjualan/penyerahan' },
      { label: 'Klaim Retur', path: '/penjualan/klaim-retur' },
      { label: 'Daftar Harga', path: '/penjualan/daftar-harga' },
      { label: 'TestPage_ Customer', path: '/penjualan/customer/test' },
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
      { label: 'Piutang (Receivable)', path: '/finansial/piutang' },
      { label: 'Liabilitas (Hutang)', path: '/finansial/liabilitas' },
      { label: 'Harga Stok', path: '/finansial/modal-stok' },
      { label: 'TestPage_ KasBank', path: '/finansial/kas-bank/test' },
      { label: 'TestPage_Pengeluaran', path: '/finansial/pengeluaran/test' },
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
];
