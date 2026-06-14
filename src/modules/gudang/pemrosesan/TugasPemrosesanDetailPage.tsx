import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailShell } from '../../../ui/components/common/shells/DetailShell';
import { Badge } from '../../../ui/components/elements/Badge';
import { AttachmentDisplay } from '../../../ui/components/elements/AttachmentDisplay';
import { AuditTrail } from '../../../ui/components/elements/AuditTrail';
import { Label } from '../../../ui/components/elements/Label';
import { pemrosesanService } from '../../../logic/services/pemrosesanService';
import { ITs_Pemrosesan, IPemrosesanLogPayload, ITs_PemrosesanLog } from '../../../logic/types/ITs_Pemrosesan';
import { formatDateFull as formatDateTime } from '../../../logic/utils/date';
import { dbClient } from '../../../logic/libs/database';
import { swalConfig, toast as swalToast } from '../../../logic/utils/swalConfig';
import { getActualTime } from '../../../logic/utils/time';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { Button, PrimaryButton, SecondaryButton } from '../../../ui/components/elements/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../ui/components/common/Table';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { TextInput, NumberInput, PercentageInput, LongTextInput } from '../../../ui/components/elements/Inputs';
import { MultipleUploadInput } from '../../../ui/components/elements/UploadInput';
import { Modal } from '../../../ui/components/common/Modal';
import { CustomValueDropdown } from '../../../ui/components/elements/Dropdown';
import { DateTimeInput } from '../../../ui/components/elements/DateTimeInput';
import { cn } from '../../../logic/utils/cn';

/**
 * TUGAS PEMROSESAN DETAIL PAGE
 * Tampilan detail data pemrosesan (Read Only).
 */
export const TugasPemrosesanDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state: { viewport } } = useGlobalState();
  const isMobile = viewport.isCompact;
  
  const [data, setData] = useState<ITs_Pemrosesan | null>(null);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ITs_PemrosesanLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activityOptions, setActivityOptions] = useState<{label: string, value: string}[]>([]);

  const getNowIso = () => {
    const now = new Date(getActualTime());
    return now.getFullYear() + '-' + 
           String(now.getMonth() + 1).padStart(2, '0') + '-' + 
           String(now.getDate()).padStart(2, '0') + 'T' + 
           String(now.getHours()).padStart(2, '0') + ':' + 
           String(now.getMinutes()).padStart(2, '0');
  };

  const [logPayload, setLogPayload] = useState<IPemrosesanLogPayload>({
    pemrosesan_id: '',
    datetime: getNowIso(),
    jenis_log: '',
    qty_sebelum: 0,
    qty_sesudah: 0,
    kadar_air_post: undefined,
    keterangan: '',
    files: []
  });

  const loadData = async () => {
    if (!id) return;
    try {
      const item = await pemrosesanService.getById(id);
      if (item) {
        setData(item);
        const postQty = (item.qty_sebelum || 0) - (item.qty_penyusutan || 0);
        const entryStock = item.qty_masuk_stok || 0;
        const currentTotal = Math.max(0, postQty - entryStock);

        setLogPayload(prev => ({
          ...prev,
          pemrosesan_id: item.id,
          datetime: getNowIso(),
          qty_sebelum: currentTotal,
          qty_sesudah: currentTotal
        }));
        const sql = `
          SELECT 
            pp.name as nama_produk, pp.category, pp.sub_category, pp.unit,
            p.po_number as kode_pembelian,
            r.datetime as receiving_time
          FROM penerimaan r
          JOIN pembelian_produk pp ON r.purchase_product_id = pp.id
          JOIN pembelian p ON r.purchase_id = p.id
          WHERE r.id = ?
        `;
        const res = await dbClient.query(sql, [item.receiving_id]);
        if (res.rows.length > 0) setProductInfo(res.rows[0]);

        // Load distinct jenis_log of activity from database
        const distinctRes = await dbClient.query(`
          SELECT DISTINCT jenis_log 
          FROM pemrosesan_log 
          WHERE jenis_log IS NOT NULL AND jenis_log != '' 
          ORDER BY jenis_log ASC
        `);
        const opts = distinctRes.rows.map((row: any) => ({
          label: row.jenis_log as string,
          value: row.jenis_log as string
        }));
        setActivityOptions(opts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const currentTotalQty = Math.max(0, ((data?.qty_sebelum || 0) - (data?.qty_penyusutan || 0)) - (data?.qty_masuk_stok || 0));

  const isFormValid = !!(
    logPayload.jenis_log && 
    logPayload.datetime && 
    logPayload.qty_sebelum !== undefined && 
    logPayload.qty_sesudah !== undefined &&
    logPayload.qty_sebelum <= currentTotalQty &&
    logPayload.qty_sesudah <= logPayload.qty_sebelum
  );

  const handleAddLog = async () => {
    if (!isFormValid) {
      if (logPayload.qty_sebelum > currentTotalQty) {
        swalToast.fire({ icon: 'error', title: 'Qty Sebelum tidak boleh melebihi Qty Akhir Terkini' });
      } else if (logPayload.qty_sesudah > logPayload.qty_sebelum) {
        swalToast.fire({ icon: 'error', title: 'Qty Sesudah tidak boleh melebihi Qty Sebelum' });
      } else {
        swalToast.fire({ icon: 'warning', title: 'Harap lengkapi data mandatory' });
      }
      return;
    }

    const confirm = await swalConfig.fire({
        title: 'Konfirmasi Simpan Log',
        text: 'Data log aktivitas yang sudah disimpan TIDAK DAPAT diubah atau dihapus. Apakah Anda yakin?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Simpan',
        cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    const res = await pemrosesanService.addLog(logPayload);
    if (res) {
      swalToast.fire({ icon: 'success', title: 'Log berhasil ditambahkan' });
      setIsLogModalOpen(false);
      loadData();
    }
  };

  const handleCompleteProcess = async () => {
    const confirm = await swalConfig.fire({
      title: 'Selesaikan Pemrosesan?',
      text: 'Status akan diubah menjadi Selesai dan data akan dikunci.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesai',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      const ok = await pemrosesanService.completeBatch(id!);
      if (ok) {
        swalToast.fire({ icon: 'success', title: 'Batch Pemrosesan Selesai' });
        loadData();
      }
    }
  };

  if (isLoading) return <div className="p-[2rem] text-center text-[#64748b]">Memuat data...</div>;
  if (!data) return <div className="p-[2rem] text-center text-red-500 font-bold">Data tidak ditemukan</div>;

  const parseAttachments = (jsonStr?: string) => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => typeof item === 'string' ? { url: item } : item);
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const initialUnitPrice = data.qty_sebelum > 0 ? data.initial_valuation / data.qty_sebelum : 0;
  
  // Dynamic metrics based on stock entries
  const qtyPascaProses = data.qty_sebelum - data.qty_penyusutan;
  const qtyMasukStok = data.qty_masuk_stok || 0;
  const qtyAkhirTerkini = Math.max(0, qtyPascaProses - qtyMasukStok);

  const totalValuasiMasukStok = data.total_price_masuk_stok || 0;
  const valuasiBerjalan = Math.max(0, data.initial_valuation - totalValuasiMasukStok);

  const hargaSatuanTerkini = qtyAkhirTerkini > 0 ? valuasiBerjalan / qtyAkhirTerkini : 0;

  const ValueBox: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(
      "w-full px-SpacingBase py-SpacingSmall rounded-RadiusMedium border border-ColorSidebarBorder/OpacityMuted bg-ColorBgSecondary/OpacityMuted min-h-[2.5rem] flex items-center text-FontSizeSm font-medium text-TextColorBase",
      className
    )}>
      {children}
    </div>
  );

  return (
    <DetailShell
      title="Detail Pemrosesan"
      id="tugas-pemrosesan-detail-shell"
      onBack={() => navigate('/tugas-pemrosesan')}
    >
      <div className={cn("flex flex-col", isMobile ? "gap-3" : "gap-5")}>
        
        {/* HEADER SECTION - COMPACT & ADAPTIVE */}
        <div className={cn(
          "flex justify-between items-start rounded-RadiusLarge bg-white/40 ring-1 ring-slate-100",
          isMobile ? "flex-col gap-4 p-4" : "flex-row p-5"
        )}>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col space-y-0.5">
                <h2 className={cn(
                    "font-black text-slate-800 leading-tight uppercase font-sans",
                    isMobile ? "text-FontSizeH4" : "text-FontSizeH3"
                )}>
                {productInfo?.nama_produk || '-'}
                </h2>
                <p className="text-FontSizeNano text-slate-500 font-bold tracking-wider uppercase opacity-80">
                {productInfo?.category || '-'} {productInfo?.sub_category ? `> ${productInfo.sub_category}` : ''}
                </p>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[0.6rem] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Waktu Penerimaan</span>
              <span className="text-FontSizeSm text-slate-600 font-semibold">
                {productInfo?.receiving_time ? formatDateTime(productInfo.receiving_time) : '-'}
              </span>
            </div>
          </div>

          <div className={cn(
            "flex flex-col gap-3",
            isMobile ? "w-full pt-3 border-t border-slate-100" : "items-end"
          )}>
            <div className={cn("flex flex-col", isMobile ? "" : "text-right")}>
                <span className="text-[0.6rem] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Referensi PO</span>
                <span className="text-FontSizeSm font-black text-slate-800">
                  {productInfo?.kode_pembelian || '-'}
                </span>
            </div>
            
            <div className={cn(
                "flex items-center gap-3",
                isMobile ? "w-full justify-between" : "justify-end"
            )}>
              <Badge 
                variant={data.status === 'completed' ? 'success' : 'info'} 
                className={cn(
                    "px-3 py-1 text-[0.65rem] font-black rounded-RadiusFull uppercase tracking-widest border-none",
                    data.status === 'processing' ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                )}
              >
                {data.status === 'processing' ? 'PROSES' : 'SELESAI'}
              </Badge>

              {data.status === 'processing' && (
                <PrimaryButton 
                    onClick={handleCompleteProcess}
                    id="btn-complete"
                    className="h-8 px-4 text-[0.7rem] font-black uppercase tracking-wider"
                    icon={<CheckCircle size={14} />}
                >
                    <span>Selesaikan</span>
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>

        {/* STAT CARDS - RESPONSIVE GRID */}
        <div className={cn(
            "grid gap-3",
            viewport.isDesktop ? "grid-cols-5" : viewport.isTablet ? "grid-cols-3" : "grid-cols-2"
        )}>
           <div className="bg-white border border-slate-100 p-3 rounded-RadiusMedium flex flex-col gap-0.5 shadow-sm">
              <span className="text-[0.6rem] text-slate-400 font-black uppercase tracking-wider">In (Awal)</span>
              <div className="flex items-baseline gap-1">
                <span className="text-FontSize font-black text-slate-800">{data.qty_sebelum.toLocaleString('id-ID')}</span>
                <span className="text-[0.65rem] text-slate-400 font-bold uppercase">{productInfo?.unit}</span>
              </div>
           </div>
           <div className="bg-white border border-slate-100 p-3 rounded-RadiusMedium flex flex-col gap-0.5 shadow-sm">
              <span className="text-[0.6rem] text-slate-400 font-black uppercase tracking-wider">Susut</span>
              <div className="flex items-baseline gap-1">
                <span className="text-FontSize font-black text-red-500">-{data.qty_penyusutan.toLocaleString('id-ID')}</span>
                <span className="text-[0.65rem] text-slate-400 font-bold uppercase">{productInfo?.unit}</span>
              </div>
           </div>
           <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-RadiusMedium flex flex-col gap-0.5">
              <span className="text-[0.6rem] text-slate-500 font-black uppercase tracking-wider">Pasca</span>
              <div className="flex items-baseline gap-1">
                <span className="text-FontSize font-black text-slate-700">{qtyPascaProses.toLocaleString('id-ID')}</span>
                <span className="text-[0.65rem] text-slate-500 font-bold uppercase">{productInfo?.unit}</span>
              </div>
           </div>
           <div className="bg-white border border-slate-100 p-3 rounded-RadiusMedium flex flex-col gap-0.5 shadow-sm">
              <span className="text-[0.6rem] text-slate-400 font-black uppercase tracking-wider">Ke Stok</span>
              <div className="flex items-baseline gap-1">
                <span className="text-FontSize font-black text-slate-800">{qtyMasukStok.toLocaleString('id-ID')}</span>
                <span className="text-[0.65rem] text-slate-400 font-bold uppercase">{productInfo?.unit}</span>
              </div>
           </div>
           <div className={cn(
             "bg-sky-50 border border-sky-100 p-3 rounded-RadiusMedium flex flex-col gap-0.5 shadow-sm",
             !viewport.isDesktop && !viewport.isTablet && "col-span-2 text-center items-center"
           )}>
              <span className="text-[0.6rem] text-sky-600 font-black uppercase tracking-wider">Akhir Terkini</span>
              <div className="flex items-baseline gap-1">
                <span className="text-FontSizeH4 font-black text-sky-700 leading-tight">{qtyAkhirTerkini.toLocaleString('id-ID')}</span>
                <span className="text-[0.7rem] text-sky-600 font-bold uppercase">{productInfo?.unit}</span>
              </div>
           </div>
        </div>

        {/* LOG ACTION & TABLE */}
        <div className="flex flex-col gap-3 mt-1">
            <div className={cn(
                "flex justify-between items-center px-1",
                isMobile && "flex-col gap-3 items-start"
            )}>
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-ColorPrimary rounded-full" />
                    <Label className="text-slate-800 font-black text-FontSizeNano uppercase tracking-[0.05em]">Histori Log Aktivitas</Label>
                </div>
                {data.status === 'processing' && (
                    <PrimaryButton  
                        onClick={() => setIsLogModalOpen(true)}
                        id="btn-open-modal-log"
                        size="sm"
                        icon={<PlusCircle size={14} />}
                        className="h-8 px-4 text-[0.65rem] font-bold uppercase tracking-wider"
                    >
                        Tambah Log
                    </PrimaryButton>
                )}
            </div>

            <div className="bg-white border border-slate-100 rounded-RadiusMedium overflow-hidden shadow-sm">
                <Table id="table-logs" noBorder>
                    <TableHeader>
                        <TableRow noBorder isHeader className="bg-slate-50/30">
                            <TableHead className="!py-2.5 text-[0.65rem] font-black uppercase tracking-wider text-slate-400">Waktu</TableHead>
                            <TableHead className="text-[0.65rem] font-black uppercase tracking-wider text-slate-400">Aktivitas</TableHead>
                            <TableHead className={cn("text-[0.65rem] font-black uppercase tracking-wider text-slate-400", isMobile && "hidden text-right")}>In</TableHead>
                            <TableHead className="text-[0.65rem] font-black uppercase tracking-wider text-slate-400 text-right">Out</TableHead>
                            <TableHead className={cn("text-[0.65rem] font-black uppercase tracking-wider text-slate-400 text-right", isMobile && "hidden")}>Susut</TableHead>
                            <TableHead className="text-[0.65rem] font-black uppercase tracking-wider text-slate-400 text-center">KA</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.logs && data.logs.length > 0 ? (
                            data.logs.map((log) => (
                                <TableRow 
                                    key={log.id} 
                                    noBorder 
                                    className="hover:bg-slate-50/30 transition-colors border-b border-slate-50 last:border-0 cursor-pointer group"
                                    onClick={() => {
                                        setSelectedLog(log);
                                        setIsDetailModalOpen(true);
                                    }}
                                >
                                    <TableCell noBorder className="text-slate-400 text-[0.7rem] py-2.5">
                                        {isMobile ? formatDateTime(log.datetime).split(',')[0] : formatDateTime(log.datetime)}
                                    </TableCell>
                                    <TableCell noBorder className="font-bold text-slate-700 text-FontSizeSm">{log.jenis_log}</TableCell>
                                    <TableCell noBorder className={cn("text-slate-500 text-FontSizeNano", isMobile && "hidden")}>{log.qty_sebelum.toLocaleString('id-ID')}</TableCell>
                                    <TableCell noBorder className="font-black text-amber-600 text-FontSizeSm text-right">{log.qty_sesudah.toLocaleString('id-ID')}</TableCell>
                                    <TableCell noBorder className={cn("text-red-400 font-bold text-FontSizeNano text-right", isMobile && "hidden")}>-{log.qty_penyusutan.toLocaleString('id-ID')}</TableCell>
                                    <TableCell noBorder className="text-slate-600 font-bold text-FontSizeNano text-center">{log.kadar_air_post ? `${log.kadar_air_post}%` : '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow noBorder>
                                <TableCell colSpan={isMobile ? 4 : 6} noBorder className="text-center italic py-10 text-slate-300 text-FontSizeNano">Belum ada aktivitas</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>

        {/* FOOTER: AUDIT */}
        <AuditTrail 
          id="pemrosesan-audit"
          createdAt={data.created_at} 
          createdBy={data.created_by} 
          createdTimezone={data.created_timezone}
          updatedAt={data.updated_at}
          updatedBy={data.updated_by}
          updatedTimezone={data.updated_timezone}
        />
      </div>

      {/* MODAL FORM LOG */}
      <Modal
        id="modal-add-log"
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="CATAT AKTIVITAS PEMROSESAN"
        onSubmit={handleAddLog}
        submitLabel="Simpan Log Aktivitas"
        isSubmitDisabled={!isFormValid}
        onCancel={() => setIsLogModalOpen(false)}
      >
        <div className="flex flex-col gap-[1.5rem] py-[0.5rem]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.25rem]">
                <div className="flex flex-col gap-[0.5rem]">
                    <Label required>Jenis Aktivitas</Label>
                    <CustomValueDropdown 
                        placeholder="Pilih atau ketik aktivitas..." 
                        options={activityOptions}
                        value={logPayload.jenis_log}
                        onChange={(val) => setLogPayload(p => ({ ...p, jenis_log: val }))}
                        id="dropdown-jenis-aktivitas"
                    />
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label required>Waktu Aktivitas</Label>
                    <DateTimeInput 
                        value={logPayload.datetime}
                        onChange={(val) => setLogPayload(p => ({ ...p, datetime: val }))}
                        id="input-waktu-aktivitas"
                    />
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label required>Qty Sebelum ({productInfo?.unit})</Label>
                    <NumberInput 
                        value={logPayload.qty_sebelum}
                        onChange={(e) => setLogPayload(p => ({ ...p, qty_sebelum: Number(e.target.value) }))}
                        className={cn(logPayload.qty_sebelum > currentTotalQty && "!border-red-500")}
                    />
                    {logPayload.qty_sebelum > currentTotalQty && (
                        <p className="text-[0.75rem] text-red-500 font-medium italic">Tidak boleh melebihi {currentTotalQty.toLocaleString('id-ID')} {productInfo?.unit}</p>
                    )}
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label required>Qty Sesudah ({productInfo?.unit})</Label>
                    <NumberInput 
                        value={logPayload.qty_sesudah}
                        onChange={(e) => setLogPayload(p => ({ ...p, qty_sesudah: Number(e.target.value) }))}
                        className={cn(logPayload.qty_sesudah > logPayload.qty_sebelum && "!border-red-500")}
                    />
                    {logPayload.qty_sesudah > logPayload.qty_sebelum && (
                        <p className="text-[0.75rem] text-red-500 font-medium italic">Tidak boleh melebihi Qty Sebelum</p>
                    )}
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label>Kadar Air (%)</Label>
                    <PercentageInput 
                        placeholder="Opsional..."
                        value={logPayload.kadar_air_post}
                        onChange={(e) => setLogPayload(p => ({ ...p, kadar_air_post: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    />
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label>Bukti Foto Aktivitas</Label>
                    <MultipleUploadInput 
                        maxFiles={3}
                        onFilesChange={(fs) => setLogPayload(p => ({ ...p, files: fs }))}
                    />
                </div>
            </div>
            
            <div className="flex flex-col gap-[0.5rem]">
                <Label>Keterangan Tambahan</Label>
                <LongTextInput 
                    placeholder="Opsional..."
                    value={logPayload.keterangan}
                    onChange={(e) => setLogPayload(p => ({ ...p, keterangan: e.target.value }))}
                />
            </div>
        </div>
      </Modal>

      {/* MODAL DETAIL LOG (READ ONLY) */}
      <Modal
        id="modal-detail-log"
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="DETAIL AKTIVITAS PEMROSESAN"
        onCancel={() => setIsDetailModalOpen(false)}
        cancelLabel="Tutup"
      >
        <div className="flex flex-col gap-[1.5rem] py-[0.5rem]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.25rem]">
                <div className="flex flex-col gap-[0.5rem]">
                    <Label>Jenis Aktivitas</Label>
                    <TextInput value={selectedLog?.jenis_log || ''} readOnly disabled />
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label>Waktu Aktivitas</Label>
                    <DateTimeInput 
                        value={selectedLog?.datetime}
                        readOnly
                        disabled
                    />
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label>Qty Sebelum ({productInfo?.unit})</Label>
                    <NumberInput 
                        value={selectedLog?.qty_sebelum || 0}
                        readOnly
                        disabled
                    />
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label>Qty Sesudah ({productInfo?.unit})</Label>
                    <NumberInput 
                        value={selectedLog?.qty_sesudah || 0}
                        readOnly
                        disabled
                    />
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label>Kadar Air (%)</Label>
                    <PercentageInput 
                        value={selectedLog?.kadar_air_post}
                        readOnly
                        disabled
                    />
                </div>
                <div className="flex flex-col gap-[0.5rem]">
                    <Label>Bukti Foto Aktivitas</Label>
                    <AttachmentDisplay 
                        files={parseAttachments(selectedLog?.proof_fileurl)}
                        id="detail-log-attachments"
                    />
                </div>
            </div>
            
            <div className="flex flex-col gap-[0.5rem]">
                <Label>Keterangan Tambahan</Label>
                <LongTextInput 
                    value={selectedLog?.keterangan || ''}
                    readOnly
                    disabled
                />
            </div>

            <AuditTrail 
                id="pemrosesan-log-audit"
                createdAt={selectedLog?.created_at} 
                createdBy={selectedLog?.created_by} 
                createdTimezone={selectedLog?.created_timezone}
                className="mt-4"
            />
        </div>
      </Modal>
    </DetailShell>
  );
};

export default TugasPemrosesanDetailPage;
