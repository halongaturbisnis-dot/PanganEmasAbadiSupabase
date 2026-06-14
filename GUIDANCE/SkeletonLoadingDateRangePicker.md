# Skeleton Loading & DateRangePicker Integration Guideline

This guide outlines the standard pattern for integrating `DateRangePicker` with Data Tables, specifically regarding loading states and interaction behavior.

## Core Interaction Rules
1. **Reset Search on Date Filter**: Whenever the `DateRangePicker` value changes, the `searchTerm` (search input) must be cleared/reset to an empty string. This prevents conflicting filters.
2. **Inline Skeleton Loading**: When fetching data (triggered by date change, pagination, or sorting), the loading state in the table **MUST** use inline skeletons per cell, not a single block skeleton for the entire row.

## Layout Standard
- The `DateRangePicker` should be placed on the **right side**, aligned horizontally with the `SearchInput`.
- Use a flex container with `justify-content: space-between` to separate the search box and the date picker.

## Implementation Pattern

### 1. State & Handler
```tsx
const [searchTerm, setSearchTerm] = useState('');
const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

const handleDateRangeChange = (range: DateRange | undefined) => {
  setDateRange(range);
  setSearchTerm(''); // MANDATORY: Reset search when date changes
  setPage(1); // Reset to first page
};
```

### 2. UI Layout (Search & Filter Row)
```tsx
<div className={cn("flex items-center justify-between gap-3", isMobile && "flex-col items-stretch")}>
  <div className={cn(isMobile ? "w-full" : "w-1/3")}>
    <SearchInput
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      // ... styling
    />
  </div>

  <div className={cn(isMobile ? "w-full" : "flex-shrink-0")}>
    <DateRangePicker
      date={dateRange}
      onDateChange={handleDateRangeChange}
      // ... styling
    />
  </div>
</div>
```

### 3. Table Skeleton (Inline Pattern)
Instead of a single `colSpan` skeleton, map through your column structure to provide a more natural loading feel.

```tsx
<TableBody>
  {isLoading ? (
    Array.from({ length: 8 }).map((_, idx) => (
      <TableRow key={`skeleton-${idx}`} noBorder={true}>
        {/* Match the number and alignment of your actual columns */}
        <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-28" /></TableCell>
        <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-40" /></TableCell>
        <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
        <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
        <TableCell noBorder={true} className="px-SpacingBase py-4"><Skeleton className="h-8 w-8 mx-auto rounded-md" /></TableCell>
      </TableRow>
    ))
  ) : (
    // ... actual data rendering
  )}
</TableBody>
```

## Benefits
- **Visual Continuity**: Inline skeletons maintain the "shape" of the data table while content is loading.
- **Improved UX**: Setting search to empty avoids "no data found" confusion when a user filters by date while a specific search term is still active.
