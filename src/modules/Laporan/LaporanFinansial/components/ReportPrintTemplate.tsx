import React from 'react';
import { appAssets } from '../../../../ui/styles/assets';
import { formatDate } from '../../../../logic/utils/date';
import { LabaRugiContent } from './LabaRugiContent';
import { EkuitasContent } from './EkuitasContent';

interface ReportPrintTemplateProps {
  id: string;
  title: string;
  dateRange: { from?: Date; to?: Date };
  type: 'labarugi' | 'ekuitas';
  data: any;
}

export const ReportPrintTemplate: React.FC<ReportPrintTemplateProps> = ({ 
  id, 
  title, 
  dateRange, 
  type, 
  data 
}) => {
  const dateStr = dateRange.from && dateRange.to 
    ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
    : '-';

  return (
    <div 
      id={id} 
      style={{ width: '794px', minHeight: '1123px' }} 
      className="invoice-page-sheet bg-white p-[50px] flex flex-col gap-SpacingBase"
    >
      {/* Header with Logo */}
      <div className="flex justify-between items-start border-b-2 border-Slate900 pb-SpacingSmall">
        <div className="flex flex-col gap-1">
          <h1 className="text-FontSizeLg font-extrabold text-TextColorBase uppercase tracking-widest leading-none">
            {title}
          </h1>
          <p className="text-FontSizeXs text-TextColorMuted font-medium italic mt-1">
            Periode Laporan: {dateStr}
          </p>
          <div className="flex flex-col mt-2">
            <span className="text-FontSizeXs font-bold text-TextColorBase">{appAssets.Company}</span>
            <span className="text-[10px] text-TextColorMuted">{appAssets.Alamat}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <img src={appAssets.devBrand} alt="Logo" className="h-14 w-auto object-contain" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 mt-SpacingSmall">
        {type === 'labarugi' ? (
          <LabaRugiContent data={data} />
        ) : (
          <EkuitasContent data={data} />
        )}
      </div>

      {/* Footer / Watermark */}
      <div className="mt-auto pt-SpacingSmall border-t border-Slate200 flex justify-between items-center text-[10px] text-TextColorMuted italic">
        <span>Laporan Finansial {appAssets.Company}</span>
        <span>Dicetak pada: {formatDate(new Date(), { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' } as any)}</span>
      </div>
    </div>
  );
};
