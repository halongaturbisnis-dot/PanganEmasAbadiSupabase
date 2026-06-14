import React, { useState } from 'react';
import { SampleLayout } from '../../../ui/wrapper/SampleLayout';
import { RouteMap } from '../../../ui/components/elements/RouteMap';
import { Badge } from '../../../ui/components/elements/Badge';
import { cn } from '../../../logic/utils/cn';
import { MapPoint } from '../../../logic/types/map';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Map as MapIcon, 
  ChevronRight,
  User,
  Clock,
  ExternalLink
} from 'lucide-react';

const SAMPLE_POINTS: MapPoint[] = [
  {
    id: 1,
    lat: -6.2247,
    lng: 106.8077,
    timestamp: '2026-05-06T08:30:00Z',
    title: 'Customer A - Sudirman',
    description: 'Initial visit for monthly replenishment. Customer requested faster lead time.'
  },
  {
    id: 2,
    lat: -6.2305,
    lng: 106.8236,
    timestamp: '2026-05-06T10:15:00Z',
    title: 'Customer B - Kuningan',
    description: 'Follow up on previous order discrepancy. Resolved and signed off.'
  },
  {
    id: 3,
    lat: -6.1852,
    lng: 106.8270,
    timestamp: '2026-05-06T13:00:00Z',
    title: 'Customer C - Menteng',
    description: 'Lunch meeting with decision maker. Discussion about premium contract extension.'
  },
  {
    id: 4,
    lat: -6.1751,
    lng: 106.8650,
    timestamp: '2026-05-06T15:45:00Z',
    title: 'Customer D - Kelapa Gading',
    description: 'Emergency support for technical glitch. Client satisfied with quick response.'
  }
];

export const VisitMonitoring: React.FC = () => {
  const { t } = useGlobalState();
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  return (
    <SampleLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-primary)] font-medium text-sm mb-1">
              <MapIcon size="1rem" />
              <span>{t('map.route')}</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-base)] tracking-tight">
              {t('map.title')}
            </h1>
            <p className="text-[var(--color-text-muted)] mt-2 flex items-center gap-2">
              <Calendar size="0.875rem" />
              {new Date().toLocaleDateString(useGlobalState().state.language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">{t('map.representative')}</p>
              <p className="text-sm font-semibold text-[var(--color-text-base)]">Budi Santoso</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center">
              <User className="text-[var(--color-primary)]" size="1.5rem" />
            </div>
          </div>
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('map.totalVisits'), value: '4', icon: <MapIcon size="1.25rem" />, color: 'bg-blue-500/10 text-blue-600' },
            { label: t('map.completion'), value: '100%', icon: <Badge variant="success" />, color: 'bg-green-500/10 text-green-600' },
            { label: t('map.totalTime'), value: '7h 15m', icon: <Clock size="1.25rem" />, color: 'bg-amber-500/10 text-amber-600' },
            { label: t('map.inRange'), value: '98%', icon: <TrendingUp size="1.25rem" />, color: 'bg-indigo-500/10 text-indigo-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-tertiary)]/10 shadow-sm flex items-center gap-4">
              <div className={cn("p-3 rounded-lg", stat.color)}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] font-medium">{stat.label}</p>
                <p className="text-lg font-bold text-[var(--color-text-base)]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-tertiary)]/10 shadow-sm p-4">
              <RouteMap 
                points={SAMPLE_POINTS} 
                onPointClick={(p) => setSelectedPoint(p)}
              />
            </div>

            <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-tertiary)]/10 shadow-sm p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-[var(--color-text-base)]">{t('map.visitTimeline')}</h2>
                <button className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1 hover:underline">
                  {t('map.exportPdf')} <ExternalLink size="0.75rem" />
                </button>
              </div>

              <div className="relative border-l-2 border-[var(--color-tertiary)]/10 ml-3 pl-8 space-y-8">
                {SAMPLE_POINTS.map((point, index) => (
                  <div key={point.id} className="relative group cursor-pointer" onClick={() => setSelectedPoint(point)}>
                    <div className={cn(
                      "absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-[var(--color-bg)] shadow-sm flex items-center justify-center transition-transform group-hover:scale-110",
                      index === 0 ? "bg-[var(--feedback-success)]" : index === SAMPLE_POINTS.length - 1 ? "bg-[var(--feedback-error)]" : "bg-[var(--color-primary)]"
                    )}>
                      <span className="text-[10px] text-white font-bold">{index + 1}</span>
                    </div>
                    <div className="bg-[var(--color-bg-secondary)]/50 p-4 rounded-xl border border-transparent hover:border-[var(--color-primary)]/20 hover:bg-[var(--color-bg)] transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-[var(--color-text-base)] mb-1">{point.title}</h3>
                          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-sm">
                            {point.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--color-primary)] font-bold text-xs bg-[var(--color-primary)]/5 px-2 py-1 rounded-full">
                          <Clock size="0.75rem" />
                          {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Details */}
          <div className="space-y-6">
            <div className="bg-[var(--color-primary)] rounded-2xl p-6 text-white shadow-xl shadow-[var(--color-primary)]/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users size="1.5rem" />
                </div>
                <div>
                  <h3 className="font-bold">{t('map.teamOverview')}</h3>
                  <p className="text-white/60 text-xs">{t('map.activityToday')}</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Budi Santoso', status: 'Online', progress: 100 },
                  { name: 'Ani Wijaya', status: 'In Meeting', progress: 65 },
                  { name: 'Hadi Suprapto', status: 'Offline', progress: 30 }
                ].map((member, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-white/70">{member.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: `${member.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPoint && (
              <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-tertiary)]/10 shadow-sm p-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[var(--color-text-base)]">{t('map.pointDetail')}</h3>
                  <button onClick={() => setSelectedPoint(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]">
                    <Badge variant="outline">{t('map.close')}</Badge>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">{t('map.targetName')}</p>
                    <p className="text-sm font-bold text-[var(--color-text-base)]">{selectedPoint.title}</p>
                  </div>
                  <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">{t('map.visitTime')}</p>
                    <p className="text-sm font-bold text-[var(--color-text-base)] flex items-center gap-2">
                       <Clock size="1rem" className="text-[var(--color-primary)]" />
                       {new Date(selectedPoint.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-amber-600 mb-1 flex items-center gap-1">
                      {t('map.reportNotes')}
                    </p>
                    <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                      {selectedPoint.description}
                    </p>
                  </div>
                  <button className="w-full py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    {t('map.openGoogleMaps')} <ChevronRight size="1rem" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SampleLayout>
  );
};
