import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Bell, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { pushNotificationService } from '../../../logic/services/pushNotificationService';
import { linkService } from '../../../logic/services/linkService';

export const PushNotificationTest: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>(Notification.permission);
  const [subscription, setSubscription] = useState<any>(null);

  const handleRequestPermission = async () => {
    const result = await pushNotificationService.requestPermission();
    setStatus(result);
  };

  const handleSubscribe = async () => {
    const sub = await pushNotificationService.subscribeUser();
    if (sub) {
      setSubscription(sub);
      alert('Subscription Successful! JSON saved to console.');
      console.log('Subscription:', JSON.stringify(sub));
    } else {
      alert('Subscription failed. Check console for details (maybe VAPID key is missing).');
    }
  };

  const handleLocalTest = async () => {
    if (status !== 'granted') {
      alert('Please grant permission first!');
      return;
    }
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification('Local Test Notification', {
        body: 'Ini adalah notifikasi tanpa perlu server backend!',
        icon: 'https://cdn-icons-png.flaticon.com/512/1055/1055666.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1055/1055666.png',
        data: { url: window.location.href }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ui-bg)] p-[var(--spacing-large)]">
      <div className="max-w-4xl mx-auto">
        <header className="mb-[var(--spacing-large)] flex justify-between items-center px-[var(--spacing-small)]">
          <div>
            <h1 className="text-[var(--font-size-h1)] font-bold text-[var(--text-base)]">Push Notification Logic</h1>
            <p className="text-[var(--text-muted)] text-[var(--font-size-sm)]">Infrastructure for Web Push & External Links</p>
          </div>
          <button 
            onClick={() => navigate('/sample')}
            className="px-[var(--spacing-base)] py-[var(--spacing-small)] bg-[var(--ui-primary)] text-white rounded-[var(--radius-sm)] text-[var(--font-size-sm)] font-medium"
          >
            Back to Menu
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-large)]">
          {/* Push Notification Section */}
          <div className="p-[var(--spacing-large)] bg-[var(--ui-primary)]/5 border border-[var(--ui-primary)]/10 rounded-[var(--radius-large)] flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-6 h-6 text-orange-500" />
              <h2 className="text-[var(--font-size-h3)] font-bold">Web Push Setup</h2>
            </div>
            
            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-center bg-white/50 p-2 rounded-[var(--radius-base)] border border-white/20">
                  <span className="text-[var(--font-size-xs)] font-medium">Status:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    status === 'granted' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                  }`}>
                    {status}
                  </span>
               </div>
               <div className="flex justify-between items-center bg-white/50 p-2 rounded-[var(--radius-base)] border border-white/20">
                  <span className="text-[var(--font-size-xs)] font-medium">Synced Icons:</span>
                  <span className="text-[10px] text-green-600 font-bold uppercase">Linked to Assets.ts</span>
               </div>
            </div>

            <div className="text-[var(--font-size-xs)] text-[var(--text-muted)] leading-relaxed">
               This uses a background Service Worker. iOS 16.4+ support is ready. 
               <br/><br/>
               <span className="font-bold text-[var(--text-base)]">Backend Requirements:</span>
               <ul className="list-disc ml-4 mt-1 opacity-70 border-t border-black/5 pt-2">
                 <li>Install <code className="bg-black/5 px-1 rounded">web-push</code> on your server</li>
                 <li>Add <code className="bg-black/5 px-1 rounded">PUSH_PRIVATE_KEY</code> to your .env</li>
                 <li>Use <code className="bg-black/5 px-1 rounded">PUSH_SUBJECT</code> for VAPID identification</li>
               </ul>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button 
                onClick={handleRequestPermission}
                className="w-full py-3 bg-[var(--ui-primary)] text-white rounded-[var(--radius-base)] font-bold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Request Permission
              </button>
              
              <button 
                onClick={handleLocalTest}
                disabled={status !== 'granted'}
                className="w-full py-3 bg-white border border-[var(--ui-primary)] text-[var(--ui-primary)] rounded-[var(--radius-base)] font-bold disabled:opacity-50"
              >
                Test Local Notif
              </button>

              <button 
                onClick={handleSubscribe}
                disabled={status !== 'granted'}
                className="w-full py-3 border border-orange-500 text-orange-500 rounded-[var(--radius-base)] font-bold disabled:opacity-50"
              >
                Subscribe to Push
              </button>
            </div>
          </div>

          {/* External Link Section */}
          <div className="p-[var(--spacing-large)] bg-[var(--ui-primary)]/5 border border-[var(--ui-primary)]/10 rounded-[var(--radius-large)] flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <ExternalLink className="w-6 h-6 text-blue-500" />
              <h2 className="text-[var(--font-size-h3)] font-bold">Global Link Handler</h2>
            </div>

            <p className="text-[var(--font-size-xs)] text-[var(--text-muted)] leading-relaxed">
              Standardized logic for opening links in new tabs. Ensures PWA users on iOS don't get stuck in a "refreeze" state when navigating back.
            </p>

            <div className="flex flex-col gap-3 mt-4">
               <button 
                onClick={() => linkService.openExternal('https://google.com')}
                className="w-full py-3 bg-blue-500 text-white rounded-[var(--radius-base)] font-bold flex items-center justify-center gap-2"
              >
                Open Google (Logic Based)
              </button>
              
               <button 
                onClick={() => linkService.openMedia('https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=2069')}
                className="w-full py-3 border border-blue-500 text-blue-500 rounded-[var(--radius-base)] font-bold flex items-center justify-center gap-2"
              >
                Open Image (Tab Handler)
              </button>
            </div>

            <div className="mt-auto p-4 bg-blue-500/5 border border-blue-500/10 rounded-[var(--radius-base)] flex gap-3">
               <Info className="w-5 h-5 text-blue-500 shrink-0" />
               <p className="text-[10px] text-[var(--text-muted)]">
                 The logic uses <code className="text-blue-500 font-bold">window.open</code> with security flags and fallback to <code className="text-blue-500 font-bold">location.href</code> if blocked.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationTest;
