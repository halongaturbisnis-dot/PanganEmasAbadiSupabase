/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useScrollRestore } from './logic/hooks/useScrollRestore';
import { MainAppLayout } from './ui/wrapper/MainAppLayout';
import { DashboardPage } from './modules/DashboardPage';
import { SampleMenu } from './modules/sample/pages/SampleMenu';
import { FontSimulation } from './modules/sample/pages/FontSimulation';
import { IconVisualization } from './modules/sample/pages/IconVisualization';
import { PushNotificationTest } from './modules/sample/pages/PushNotificationTest';
import { ShellShowcase } from './modules/sample/pages/ShellShowcase';
import { PaginationSample } from './modules/sample/pages/PaginationSample';
import { ProfilePhotoSample } from './modules/sample/pages/ProfilePhotoSample';
import { AdvancedUiSample } from './modules/sample/pages/AdvancedUiSample';
import { DataTablePlusSample } from './modules/sample/pages/DataTablePlusSample';
import { FormWizardSample } from './modules/sample/pages/FormWizardSample';
import { VersatileComponentsSample } from './modules/sample/pages/VersatileComponentsSample';
import { VisitMonitoring } from './modules/sample/pages/VisitMonitoring';
import { RangeCalendarSample } from './modules/sample/pages/RangeCalendarSample';
import { AccordionSimulation } from './modules/sample/pages/AccordionSimulation';
import { BarcodeDisplaySimulation } from './modules/sample/pages/BarcodeDisplaySimulation';
import { BottomSheetSimulation } from './modules/sample/pages/BottomSheetSimulation';
import { BreadcrumbsSimulation } from './modules/sample/pages/BreadcrumbsSimulation';
import { CardSimulation } from './modules/sample/pages/CardSimulation';
import { CommandPaletteSimulation } from './modules/sample/pages/CommandPaletteSimulation';
import { ConfirmDialogSimulation } from './modules/sample/pages/ConfirmDialogSimulation';
import { DataTablePlusSimulation } from './modules/sample/pages/DataTablePlusSimulation';
import { ConnectionTestPage } from './modules/sample/pages/ConnectionTestPage';
import { TestPage_Akun } from './modules/akun/pages/TestPage_Akun';
import { CustomerPage } from './modules/penjualan/customer/pages/CustomerPage';
import { CustomerFormPage } from './modules/penjualan/customer/pages/CustomerFormPage';
import { CustomerDetailPage } from './modules/penjualan/customer/pages/CustomerDetailPage';
import { TestPage_Customer } from './modules/penjualan/TestPage_Customer';
import { DaftarHargaPage } from './modules/penjualan/DaftarHarga/DaftarHargaPage';
import { PenjualanPage } from './modules/penjualan/penjualan/pages/PenjualanPage';
import { PenjualanFormPage } from './modules/penjualan/penjualan/pages/PenjualanFormPage';
import { PenjualanDetailPage } from './modules/penjualan/penjualan/pages/PenjualanDetailPage';
import { PenyerahanPage } from './modules/penjualan/penyerahan/PenyerahanPage';
import { PengantaranPage } from './modules/pengantaran/PengantaranPage';
import { KlaimReturPage } from './modules/penjualan/KlaimRetur/KlaimReturPage';
import { KlaimReturFormPage } from './modules/penjualan/KlaimRetur/KlaimReturFormPage';
import { KlaimReturDetailPage } from './modules/penjualan/KlaimRetur/KlaimReturDetailPage';
import { TestPage_Suplier } from './modules/pengadaan/suplier/TestPage_Suplier';
import { TestPage_BankAndCash } from './modules/Finansial/KasBank/TestPage_BankAndCash';
import { TestPage_Pengeluaran } from './modules/Finansial/Pengeluaran/TestPage_Pengeluaran';
import { PengeluaranPage } from './modules/Finansial/Pengeluaran/pages/PengeluaranPage';
import { PengeluaranFormPage } from './modules/Finansial/Pengeluaran/pages/PengeluaranFormPage';
import { PengeluaranDetailPage } from './modules/Finansial/Pengeluaran/pages/PengeluaranDetailPage';
import { PemasukanPage } from './modules/Finansial/Pemasukan/pages/PemasukanPage';
import { PemasukanFormPage } from './modules/Finansial/Pemasukan/pages/PemasukanFormPage';
import { PemasukanDetailPage } from './modules/Finansial/Pemasukan/pages/PemasukanDetailPage';
import { LiabilitasPage } from './modules/Finansial/Liabilitas/pages/LiabilitasPage';
import { LiabilitasFormPage } from './modules/Finansial/Liabilitas/pages/LiabilitasFormPage';
import { LiabilitasDetailPage } from './modules/Finansial/Liabilitas/pages/LiabilitasDetailPage';
import { PiutangPage } from './modules/Finansial/Piutang/pages/PiutangPage';
import { PiutangFormPage } from './modules/Finansial/Piutang/pages/PiutangFormPage';
import { PiutangDetailPage } from './modules/Finansial/Piutang/pages/PiutangDetailPage';
import { ModalStokPage } from './modules/Finansial/ModalStok/ModalStokPage';
import { BankAndCashPage } from './modules/Finansial/KasBank/pages/BankAndCashPage';
import { BankAndCashFormPage } from './modules/Finansial/KasBank/pages/BankAndCashFormPage';
import { BankAndCashDetailPage } from './modules/Finansial/KasBank/pages/BankAndCashDetailPage';
import { SuplierPage } from './modules/pengadaan/suplier/pages/SuplierPage';
import { SuplierFormPage } from './modules/pengadaan/suplier/pages/SuplierFormPage';
import { SuplierDetailPage } from './modules/pengadaan/suplier/pages/SuplierDetailPage';
import { PembelianPage } from './modules/pengadaan/pembelian/pages/PembelianPage';
import { PembelianFormPage } from './modules/pengadaan/pembelian/pages/PembelianFormPage';
import { PembelianDetailPage } from './modules/pengadaan/pembelian/pages/PembelianDetailPage';
import { PengirimanPage } from './modules/pengadaan/pengiriman/pages/PengirimanPage';
import { PengirimanFormPage } from './modules/pengadaan/pengiriman/pages/PengirimanFormPage';
import { PengirimanDetailPage } from './modules/pengadaan/pengiriman/pages/PengirimanDetailPage';
import { PenerimaanPage } from './modules/gudang/penerimaan/PenerimaanPage';
import { PenerimaanFormPage } from './modules/gudang/penerimaan/PenerimaanFormPage';
import { PenerimaanDetailPage } from './modules/gudang/penerimaan/PenerimaanDetailPage';
import { PemrosesanPage } from './modules/gudang/pemrosesan/PemrosesanPage';
import { PemrosesanDetailPage } from './modules/gudang/pemrosesan/PemrosesanDetailPage';
import { TugasPemrosesanPage } from './modules/gudang/pemrosesan/TugasPemrosesanPage';
import { TugasPemrosesanDetailPage } from './modules/gudang/pemrosesan/TugasPemrosesanDetailPage';
import { StokMasukPage } from './modules/gudang/StokMasuk/StokMasukPage';
import { StokMasukFormPage } from './modules/gudang/StokMasuk/StokMasukFormPage';
import { StokBerjalanPage } from './modules/gudang/StokBerjalan/StokBerjalanPage';
import { StokReturPage } from './modules/gudang/StokRetur/StokReturPage';
import { StokTerbuangPage } from './modules/gudang/StokTerbuang/StokTerbuangPage';
import { StokOpnamePage } from './modules/StokOpname/StokOpnamePage';
import { AkunPage } from './modules/akun/pages/AkunPage';
import { AkunFormPage } from './modules/akun/pages/AkunFormPage';
import { AkunDetailPage } from './modules/akun/pages/AkunDetailPage';
import { ProfilePage } from './modules/akun/pages/ProfilePage';
import { PersetujuanPage } from './modules/penjualan/persetujuan/pages/PersetujuanPage';
import { LaporanPenjualanPage } from './modules/Laporan/LaporanPenjualan/pages/LaporanPenjualanPage';
import { LaporanFinansialPage } from './modules/Laporan/LaporanFinansial/pages/LaporanFinansialPage';
import { LaporanProdukPage } from './modules/Laporan/LaporanProduk/pages/LaporanProdukPage';
import { LaporanPemasaranPage } from './modules/Laporan/LaporanPemasaran/pages/LaporanPemasaranPage';
import { LaporanCustomerPage } from './modules/Laporan/LaporanCustomer/pages/LaporanCustomerPage';
import { LoginPage } from './modules/auth/LoginPage';
import WelcomingPage from './modules/WelcomingPage';
import { PemasaranPage } from './modules/Pemasaran/PemasaranPage';
import { PemasaranFormPage } from './modules/Pemasaran/PemasaranFormPage';
import { PemasaranDetailPage } from './modules/Pemasaran/PemasaranDetailPage';
import { PemasaranAkunPage } from './modules/Pemasaran/PemasaranAkunPage';
import { PemasaranAkunFormPage } from './modules/Pemasaran/PemasaranAkunFormPage';
import { PemasaranAkunDetailPage } from './modules/Pemasaran/PemasaranAkunDetailPage';
import { GlobalLoading } from './ui/components/LoadingState/GlobalLoading';
import { ConfirmDialog } from './ui/components/common/ConfirmDialog';
import { CommandPalette } from './ui/components/common/CommandPalette';
import { Toaster } from 'react-hot-toast';
import { useGlobalState } from './logic/context/GlobalContext';
import { APP_CONFIG } from './logic/constants/app';
import { useEffect } from 'react';
import { getDefaultRoute } from './logic/utils/auth';
import { Navigate } from 'react-router-dom';

/**
 * Scroll Restorer Component
 * Ensures every page starts at the top of the viewport.
 */
function ScrollRestorer() {
  useScrollRestore();
  return null;
}

function AppContent() {
  const { state, t } = useGlobalState();

  useEffect(() => {
    document.title = `${APP_CONFIG.name} | ${APP_CONFIG.description}`;
  }, []);

  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        toastOptions={{
          style: {
            zIndex: 100000,
          },
        }}
        containerStyle={{
          zIndex: 100000,
        }}
      />
      <ScrollRestorer />
      <GlobalLoading isLoading={state.isLoading} text={t('feedback.loading')} />
      <ConfirmDialog />
      <CommandPalette />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Main App Layout Route Wrapper as Root */}
        <Route path="/" element={<MainAppLayout />}>
          <Route index element={<WelcomingPage />} />
          
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sample" element={<SampleMenu />} />
          <Route path="sample/fonts" element={<FontSimulation />} />
          <Route path="sample/icons" element={<IconVisualization />} />
          <Route path="sample/push" element={<PushNotificationTest />} />
          <Route path="sample/shells" element={<ShellShowcase />} />
          <Route path="sample/pagination" element={<PaginationSample />} />
          <Route path="sample/profile-photo" element={<ProfilePhotoSample />} />
          <Route path="sample/advanced-ui" element={<AdvancedUiSample />} />
          <Route path="sample/data-table-plus" element={<DataTablePlusSample />} />
          <Route path="sample/form-wizard" element={<FormWizardSample />} />
          <Route path="sample/versatile" element={<VersatileComponentsSample />} />
          <Route path="sample/calendar" element={<RangeCalendarSample />} />
          <Route path="sample/accordion" element={<AccordionSimulation />} />
          <Route path="sample/barcode-display" element={<BarcodeDisplaySimulation />} />
          <Route path="sample/bottom-sheet" element={<BottomSheetSimulation />} />
          <Route path="sample/breadcrumbs" element={<BreadcrumbsSimulation />} />
          <Route path="sample/card" element={<CardSimulation />} />
          <Route path="sample/command-palette" element={<CommandPaletteSimulation />} />
          <Route path="sample/confirm-dialog" element={<ConfirmDialogSimulation />} />
          <Route path="sample/data-table-plus-sim" element={<DataTablePlusSimulation />} />
          <Route path="sample/connection-test" element={<ConnectionTestPage />} />
          <Route path="monitoring/visits" element={<VisitMonitoring />} />
          <Route path="akun" element={<AkunPage />} />
          <Route path="akun/tambah" element={<AkunFormPage />} />
          <Route path="akun/edit/:id" element={<AkunFormPage />} />
          <Route path="akun/detail/:id" element={<AkunDetailPage />} />
          <Route path="akun/test" element={<TestPage_Akun />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="persetujuan" element={<PersetujuanPage />} />
          <Route path="pengadaan/suplier" element={<SuplierPage />} />
          <Route path="pengadaan/suplier/tambah" element={<SuplierFormPage />} />
          <Route path="pengadaan/suplier/edit/:id" element={<SuplierFormPage />} />
          <Route path="pengadaan/suplier/detail/:id" element={<SuplierDetailPage />} />
          <Route path="pengadaan/suplier/test" element={<TestPage_Suplier />} />
          <Route path="pengadaan/pembelian" element={<PembelianPage />} />
          <Route path="pengadaan/pembelian/tambah" element={<PembelianFormPage />} />
          <Route path="pengadaan/pembelian/edit/:id" element={<PembelianFormPage />} />
          <Route path="pengadaan/pembelian/detail/:id" element={<PembelianDetailPage />} />
          <Route path="pengadaan/pengiriman" element={<PengirimanPage />} />
          <Route path="pengadaan/pengiriman/tambah" element={<PengirimanFormPage />} />
          <Route path="pengadaan/pengiriman/edit/:id" element={<PengirimanFormPage />} />
          <Route path="pengadaan/pengiriman/detail/:id" element={<PengirimanDetailPage />} />
          
          <Route path="gudang/penerimaan" element={<PenerimaanPage />} />
          <Route path="gudang/penerimaan/tambah" element={<PenerimaanFormPage />} />
          <Route path="gudang/penerimaan/edit/:id" element={<PenerimaanFormPage />} />
          <Route path="gudang/penerimaan/detail/:id" element={<PenerimaanDetailPage />} />
          <Route path="gudang/stok-masuk" element={<StokMasukPage />} />
          <Route path="gudang/stok-masuk/tambah" element={<StokMasukFormPage />} />
          <Route path="gudang/stok-masuk/edit/:id" element={<StokMasukFormPage />} />
          <Route path="gudang/stok-berjalan" element={<StokBerjalanPage />} />
          <Route path="gudang/stok-retur" element={<StokReturPage />} />
          <Route path="gudang/stok-terbuang" element={<StokTerbuangPage />} />
          <Route path="gudang/pemrosesan" element={<PemrosesanPage />} />
          <Route path="gudang/pemrosesan/detail/:id" element={<PemrosesanDetailPage />} />
          <Route path="tugas-pemrosesan" element={<TugasPemrosesanPage />} />
          <Route path="tugas-pemrosesan/detail/:id" element={<TugasPemrosesanDetailPage />} />
          <Route path="stok-opname" element={<StokOpnamePage />} />
 
          <Route path="penjualan/customer" element={<CustomerPage />} />
          <Route path="penjualan/customer/tambah" element={<CustomerFormPage />} />
          <Route path="penjualan/customer/edit/:id" element={<CustomerFormPage />} />
          <Route path="penjualan/customer/detail/:id" element={<CustomerDetailPage />} />
          <Route path="penjualan/customer/test" element={<TestPage_Customer />} />
          <Route path="penjualan/penjualan" element={<PenjualanPage />} />
          <Route path="penjualan/penjualan/tambah" element={<PenjualanFormPage />} />
          <Route path="penjualan/penjualan/edit/:id" element={<PenjualanFormPage />} />
          <Route path="penjualan/penjualan/detail/:id" element={<PenjualanDetailPage />} />
          <Route path="penjualan/penyerahan" element={<PenyerahanPage />} />
          <Route path="pengantaran" element={<PengantaranPage />} />
          <Route path="penjualan/klaim-retur" element={<KlaimReturPage />} />
          <Route path="penjualan/klaim-retur/tambah" element={<KlaimReturFormPage />} />
          <Route path="penjualan/klaim-retur/edit/:id" element={<KlaimReturFormPage />} />
          <Route path="penjualan/klaim-retur/detail/:id" element={<KlaimReturDetailPage />} />
          <Route path="penjualan/daftar-harga" element={<DaftarHargaPage />} />
          
          <Route path="finansial/kas-bank" element={<BankAndCashPage />} />
          <Route path="finansial/kas-bank/tambah" element={<BankAndCashFormPage />} />
          <Route path="finansial/kas-bank/edit/:id" element={<BankAndCashFormPage />} />
          <Route path="finansial/kas-bank/detail/:id" element={<BankAndCashDetailPage />} />
          <Route path="finansial/kas-bank/test" element={<TestPage_BankAndCash />} />
          <Route path="finansial/pengeluaran" element={<PengeluaranPage />} />
          <Route path="finansial/pengeluaran/tambah" element={<PengeluaranFormPage />} />
          <Route path="finansial/pengeluaran/edit/:id" element={<PengeluaranFormPage />} />
          <Route path="finansial/pengeluaran/detail/:id" element={<PengeluaranDetailPage />} />
          <Route path="finansial/pengeluaran/test" element={<TestPage_Pengeluaran />} />
          <Route path="finansial/pemasukan" element={<PemasukanPage />} />
          <Route path="finansial/pemasukan/tambah" element={<PemasukanFormPage />} />
          <Route path="finansial/pemasukan/edit/:id" element={<PemasukanFormPage />} />
          <Route path="finansial/pemasukan/detail/:id" element={<PemasukanDetailPage />} />
          <Route path="finansial/liabilitas" element={<LiabilitasPage />} />
          <Route path="finansial/liabilitas/tambah" element={<LiabilitasFormPage />} />
          <Route path="finansial/liabilitas/edit/:id" element={<LiabilitasFormPage />} />
          <Route path="finansial/liabilitas/detail/:id" element={<LiabilitasDetailPage />} />
          <Route path="finansial/piutang" element={<PiutangPage />} />
          <Route path="finansial/piutang/tambah" element={<PiutangFormPage />} />
          <Route path="finansial/piutang/edit/:id" element={<PiutangFormPage />} />
          <Route path="finansial/piutang/detail/:id" element={<PiutangDetailPage />} />
          <Route path="finansial/modal-stok" element={<ModalStokPage />} />

          <Route path="pemasaran" element={<PemasaranPage />} />
          <Route path="pemasaran/tambah" element={<PemasaranFormPage />} />
          <Route path="pemasaran/edit/:id" element={<PemasaranFormPage />} />
          <Route path="pemasaran/detail/:id" element={<PemasaranDetailPage />} />

          <Route path="pemasaran-akun" element={<PemasaranAkunPage />} />
          <Route path="pemasaran-akun/tambah" element={<PemasaranAkunFormPage />} />
          <Route path="pemasaran-akun/edit/:id" element={<PemasaranAkunFormPage />} />
          <Route path="pemasaran-akun/detail/:id" element={<PemasaranAkunDetailPage />} />
          <Route path="laporan/penjualan" element={<LaporanPenjualanPage />} />
          <Route path="laporan/finansial" element={<LaporanFinansialPage />} />
          <Route path="laporan/produk" element={<LaporanProdukPage />} />
          <Route path="laporan/pemasaran" element={<LaporanPemasaranPage />} />
          <Route path="laporan/customer" element={<LaporanCustomerPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
