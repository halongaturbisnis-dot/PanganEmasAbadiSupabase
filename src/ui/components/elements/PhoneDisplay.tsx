import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { cn } from '../../../logic/utils/cn';
import { callPhone, sendWhatsApp, sendSMS } from '../../../logic/utils/communication';
import { appAssets } from '../../styles/assets';
import { Tooltip } from '../common/Tooltip';

export interface PhoneDisplayProps {
  value?: string;
  className?: string;
  id?: string;
}

/**
 * PHONE DISPLAY
 * Reusable component to display phone numbers with clickable tooltip actions (Call, WA, SMS).
 */
export const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ 
  value, 
  className, 
  id = "phone-display"
}) => {
  // 1. Bersihkan whitespace di awal/akhir string (jika value ada)
  const trimmedValue = value?.trim();

  // 2. Cek apakah value tidak ada, kosong setelah di-trim, atau hanya berisi "-"
  if (!trimmedValue || trimmedValue === "-") {
    return <span className="text-TextColorMuted font-medium">-</span>;
  }

  return (
    <div id={id} className={cn("inline-block", className)}>
      <Tooltip
        trigger="click"
        content={
          <div className="flex items-center gap-SpacingTiny">
            {/* Phone Call */}
            <button 
              type="button"
              onClick={() => callPhone(trimmedValue)}
              className="p-SpacingNano hover:bg-white/20 rounded-RadiusTiny transition-colors text-White"
              title="Panggil Telepon"
            >
              <Phone size={16} />
            </button>
            
            {/* SMS */}
            <button 
              type="button"
              onClick={() => sendSMS(trimmedValue)}
              className="p-SpacingNano hover:bg-white/20 rounded-RadiusTiny transition-colors text-White"
              title="Kirim SMS"
            >
              <MessageSquare size={16} />
            </button>
            
            {/* WhatsApp Chat */}
            <button 
              type="button"
              onClick={() => sendWhatsApp(trimmedValue)}
              className="p-SpacingNano hover:bg-white/20 rounded-RadiusTiny transition-colors text-White"
              title="WhatsApp Chat"
            >
              <img 
                src={appAssets.WhatsappIcon} 
                alt="WA" 
                className="w-4 h-4 object-contain" 
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
        }
      >
        <span className="font-medium text-blue-600 underline cursor-pointer decoration-blue-600 underline-offset-2">
          {trimmedValue}
        </span>
      </Tooltip>
    </div>
  );
};