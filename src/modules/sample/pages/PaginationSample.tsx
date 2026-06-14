import React, { useState } from 'react';
import { MainShell } from '../../../ui/components/common/shells/MainShell';
import { Pagination } from '../../../ui/components/common/Pagination';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/components/common/Card';
import { useGlobalState } from '../../../logic/context/GlobalContext';

export const PaginationSample: React.FC = () => {
  const { t } = useGlobalState();
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = 245;
  const perPage = 10;
  const totalPages = Math.ceil(totalItems / perPage);

  return (
    <MainShell title="Pagination Sample">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('pagination.page')} Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="p-6 border border-dashed border-[var(--color-tertiary)]/30 rounded-xl bg-[var(--color-bg-secondary)]/30">
              <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-4">
                Standard pagination with chevron icons, circle active state, and dropdown page selector.
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                perPage={perPage}
                onPageChange={setCurrentPage}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-[var(--font-size-sm)]">Variations & Edge Cases</h4>
              
              <div className="p-4 border border-[var(--color-tertiary)]/10 rounded-lg">
                <p className="text-[var(--font-size-nano)] uppercase font-bold text-[var(--color-text-muted)] mb-2">Single Page (Should show minimal info)</p>
                <Pagination
                  currentPage={1}
                  totalPages={1}
                  totalItems={5}
                  perPage={10}
                  onPageChange={() => {}}
                />
              </div>

              <div className="p-4 border border-[var(--color-tertiary)]/10 rounded-lg">
                <p className="text-[var(--font-size-nano)] uppercase font-bold text-[var(--color-text-muted)] mb-2">Few Pages</p>
                <Pagination
                  currentPage={2}
                  totalPages={3}
                  totalItems={25}
                  perPage={10}
                  onPageChange={() => {}}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-[var(--color-primary)]/5 rounded-lg border border-[var(--color-primary)]/10">
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-base)] leading-relaxed">
            <strong>Designer Note:</strong> This pagination uses CSS variables from <code>tokens.ts</code>. The active page uses <code>rounded-full</code> as requested, and navigation handles labels automatically via <code>locales</code>.
          </p>
        </div>
      </div>
    </MainShell>
  );
};
