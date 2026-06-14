import React from 'react';
import { cn } from '../../../../logic/utils/cn';
import { formatCurrency } from '../../../../logic/utils/data';
import { useGlobalState } from '../../../../logic/context/GlobalContext';

interface LabaRugiContentProps {
  data: {
    pendapatanPenjualan: number;
    pendapatanPiutang: number;
    pendapatanLainLainList: { label: string; nominal: number }[];
    totalPendapatanOperasional: number;
    pengeluaranPembelian: number;
    pengeluaranHutang: number;
    pengeluaranLainLainList: { label: string; nominal: number }[];
    totalPengeluaranOperasional: number;
    marginProfitOperasional: number;
  };
}

export const LabaRugiContent: React.FC<LabaRugiContentProps> = ({ data }) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const rowClasses = cn(
    "flex justify-between py-1.5 gap-2",
    isMobile ? "flex-col items-start" : "items-center"
  );
  
  const totalRowClasses = cn(
    "flex justify-between py-2 mt-2 border-t border-Slate200 -mx-SpacingSmall px-SpacingSmall gap-2",
    isMobile ? "flex-col items-start" : "items-center"
  );

  return (
    <div className="flex flex-col border border-Slate200 rounded-md bg-white overflow-hidden shadow-sm">
      {/* Pendapatan */}
      <div className="flex flex-col w-full">
        <div className="bg-Slate50 px-SpacingSmall py-2 border-b border-Slate200">
          <span className="text-FontSizeXs font-bold text-TextColorBase uppercase tracking-wide">Pendapatan Operasional</span>
        </div>
        <div className="flex flex-col px-SpacingSmall py-SpacingTiny gap-1 text-FontSizeXs">
          <div className={rowClasses}>
            <span className="text-TextColorBase flex-1 leading-tight">Pendapatan Penjualan Langsung</span>
            <span className={cn("font-medium text-TextColorBase", isMobile && "w-full text-right")}>{formatCurrency(data.pendapatanPenjualan)}</span>
          </div>
          {data.pendapatanLainLainList.map((item, idx) => (
            <div key={idx} className={rowClasses}>
              <span className="text-TextColorBase flex-1 leading-tight">{item.label}</span>
              <span className={cn("font-medium text-TextColorBase", isMobile && "w-full text-right")}>{formatCurrency(item.nominal)}</span>
            </div>
          ))}
          
          <div className={cn(totalRowClasses, "bg-Emerald50/30")}>
            <span className="font-bold text-Emerald800 flex-1">Total Pendapatan</span>
            <span className={cn("font-bold text-Emerald700", isMobile && "w-full text-right text-FontSizeSm")}>{formatCurrency(data.totalPendapatanOperasional)}</span>
          </div>
        </div>
      </div>

      {/* Pengeluaran */}
      <div className="flex flex-col w-full mt-SpacingSmall">
        <div className="bg-Slate50 px-SpacingSmall py-2 border-y border-Slate200">
          <span className="text-FontSizeXs font-bold text-TextColorBase uppercase tracking-wide">Beban & Pengeluaran</span>
        </div>
        <div className="flex flex-col px-SpacingSmall py-SpacingTiny gap-1 text-FontSizeXs">
          <div className={rowClasses}>
            <span className="text-TextColorBase flex-1 leading-tight">Pembelian Stok / Kulakan</span>
            <span className={cn("font-medium text-TextColorBase", isMobile && "w-full text-right")}>{formatCurrency(data.pengeluaranPembelian)}</span>
          </div>
          {data.pengeluaranLainLainList.map((item, idx) => (
            <div key={idx} className={rowClasses}>
              <span className="text-TextColorBase flex-1 leading-tight">{item.label}</span>
              <span className={cn("font-medium text-TextColorBase", isMobile && "w-full text-right")}>{formatCurrency(item.nominal)}</span>
            </div>
          ))}
          
          <div className={cn(totalRowClasses, "bg-Red50/30")}>
            <span className="font-bold text-Red800 flex-1">Total Pengeluaran</span>
            <span className={cn("font-bold text-Red700", isMobile && "w-full text-right text-FontSizeSm")}>{formatCurrency(data.totalPengeluaranOperasional)}</span>
          </div>
        </div>
      </div>

      {/* Laba/Rugi Bersih Section */}
      <div className="flex flex-col w-full mt-1 border-t-2 border-Slate800 bg-Slate50">
        <div className={cn(
          "flex px-SpacingSmall py-3 gap-2", 
          isMobile ? "flex-col items-start" : "justify-between items-center"
        )}>
          <span className="font-extrabold text-TextColorBase uppercase tracking-widest text-FontSizeSm flex-1 leading-tight">Margin Laba / Rugi Operasional</span>
          <span className={cn(
            "font-extrabold", 
            data.marginProfitOperasional > 0 ? "text-Emerald600" : data.marginProfitOperasional < 0 ? "text-Red600" : "text-TextColorBase",
            isMobile ? "w-full text-right text-FontSizeLg" : "text-FontSizeSm"
          )}>
            {data.marginProfitOperasional > 0 ? '+' : ''}{formatCurrency(data.marginProfitOperasional)}
          </span>
        </div>
      </div>
    </div>
  );
};

