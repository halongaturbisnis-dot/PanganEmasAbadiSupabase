import React from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Skeleton } from '../../../ui/components/elements/Skeleton';
import { EmptyState } from '../../../ui/components/common/EmptyState';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { Search, UserPlus } from 'lucide-react';

export const AdvancedUiSample: React.FC = () => {
  const { t } = useGlobalState();

  return (
    <MainShell title="Advanced UI Components">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skeleton Section */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Primitives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
              Build custom loading states using flexible skeleton shapes and animations.
            </p>
            
            <div className="space-y-8">
              {/* Profile Card Skeleton */}
              <div className="p-4 border border-[var(--color-tertiary)]/20 rounded-xl space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circle" className="w-12 h-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[60%]" />
                    <Skeleton className="h-3 w-[40%]" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>

              {/* Grid Skeleton */}
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="aspect-square w-full" animation="wave" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State Section */}
        <Card>
          <CardHeader>
            <CardTitle>Empty States</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
              Polished placeholders for empty lists, failed searches, or initial data states.
            </p>

            <div className="space-y-6">
              {/* Search Empty */}
              <EmptyState icon={<Search size="2rem" />}
                title={t('emptyState.noResults')}
                description="Try adjusting your filters or search keywords to find what you're looking for."
                action={{
                  label: t('dataTable.reset'),
                  onClick: () => alert('Reset Search')
                }}
              />

              {/* Initial Data Empty */}
              <EmptyState icon={<UserPlus size="2rem" />}
                title={t('emptyState.noData')}
                description="Start by adding your first record to see it appear in the dashboard."
                action={{
                  label: t('emptyState.addFirst'),
                  onClick: () => alert('Add First')
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainShell>
  );
};
