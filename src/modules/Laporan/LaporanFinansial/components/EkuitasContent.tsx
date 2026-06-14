import React from 'react';
import { cn } from '../../../../logic/utils/cn';
import { formatCurrency } from '../../../../logic/utils/data';

interface EkuitasContentProps {
  data: {
    asetPiutang: number;
    asetValuasiStok: number;
    asetCashflowNet: number;
    totalAset: number;
    kewajibanHutang: number;
    totalKewajiban: number;
    totalEkuitas: number;
  };
}

export const EkuitasContent: React.FC<EkuitasContentProps> = ({ data }) => {
  return (
    <div className="flex flex-col border border-Slate200 rounded-md bg-white overflow-hidden shadow-sm">
      {/* Aset */}
      <div className="flex flex-col w-full">
        <div className="bg-Slate50 px-SpacingSmall py-2 border-b border-Slate200">
          <span className="text-FontSizeXs font-bold text-TextColorBase uppercase tracking-wide">Aset Lancar</span>
        </div>
        <div className="flex flex-col px-SpacingSmall py-SpacingTiny gap-2 text-FontSizeXs">
          <div className="flex justify-between items-center py-1">
            <span className="text-TextColorBase">Total Piutang Tersisa</span>
            <span className="font-medium text-TextColorBase">{formatCurrency(data.asetPiutang)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-TextColorBase">Valuasi Sisa Stok (Aktual)</span>
            <span className="font-medium text-TextColorBase">{formatCurrency(data.asetValuasiStok)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-TextColorBase">Cashflow Net Bersih</span>
            <span className="font-medium text-TextColorBase">{formatCurrency(data.asetCashflowNet)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 mt-2 border-t border-Slate200 bg-Emerald50/30 -mx-SpacingSmall px-SpacingSmall">
            <span className="font-bold text-Emerald800">Total Aset Lancar</span>
            <span className="font-bold text-Emerald700">{formatCurrency(data.totalAset)}</span>
          </div>
        </div>
      </div>

      {/* Kewajiban */}
      <div className="flex flex-col w-full mt-SpacingSmall">
        <div className="bg-Slate50 px-SpacingSmall py-2 border-y border-Slate200">
          <span className="text-FontSizeXs font-bold text-TextColorBase uppercase tracking-wide">Kewajiban</span>
        </div>
        <div className="flex flex-col px-SpacingSmall py-SpacingTiny gap-2 text-FontSizeXs">
          <div className="flex justify-between items-center py-1">
            <span className="text-TextColorBase">Total Liabilitas/Hutang Tersisa</span>
            <span className="font-medium text-TextColorBase">{formatCurrency(data.kewajibanHutang)}</span>
          </div>

          <div className="flex justify-between items-center py-2 mt-2 border-t border-Slate200 bg-Red50/30 -mx-SpacingSmall px-SpacingSmall">
            <span className="font-bold text-Red800">Total Kewajiban</span>
            <span className="font-bold text-Red700">{formatCurrency(data.totalKewajiban)}</span>
          </div>
        </div>
      </div>

      {/* Total Ekuitas Section */}
      <div className="flex flex-col w-full mt-1 border-t-2 border-Slate800 bg-Slate50">
        <div className="flex justify-between items-center px-SpacingSmall py-3 text-FontSizeSm">
          <span className="font-extrabold text-TextColorBase uppercase tracking-widest">Total Ekuitas</span>
          <span className={cn(
            "font-extrabold", 
            data.totalEkuitas > 0 ? "text-Emerald600" : data.totalEkuitas < 0 ? "text-Red600" : "text-TextColorBase"
          )}>
            {data.totalEkuitas > 0 ? '+' : ''}{formatCurrency(data.totalEkuitas)}
          </span>
        </div>
      </div>
    </div>
  );
};
