import React, { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
  sticky?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  mobileTitleKey?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  className = '',
  onRowClick,
}: DataTableProps<T>) {
  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  // First 3 columns for mobile stacked card
  const mobileCols = columns.slice(0, 3);

  return (
    <>
      <div className={`w-full overflow-hidden border border-border rounded-[8px] bg-surface ${className}`}>
        {/* ========================================================
            1. MOBILE VIEW (< 640px): Stacked Cards
            ======================================================== */}
        <div className="sm:hidden divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, rIdx) => (
              <div key={rIdx} className="p-3.5 space-y-2 animate-pulse">
                <div className="h-4 bg-surface-muted rounded-[4px] w-2/3" />
                <div className="h-3 bg-surface-muted rounded-[4px] w-1/2" />
                <div className="h-3 bg-surface-muted rounded-[4px] w-1/3" />
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              {emptyMessage}
            </div>
          ) : (
            data.map((row, index) => (
              <div
                key={keyExtractor(row, index)}
                onClick={() => {
                  if (onRowClick) {
                    onRowClick(row);
                  } else {
                    setSelectedRow(row);
                  }
                }}
                className="p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer flex items-center justify-between gap-3 active:bg-surface-subtle/80"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  {mobileCols.map((col, cIdx) => (
                    <div key={col.key} className="flex items-baseline justify-between gap-2 text-xs">
                      {cIdx === 0 ? (
                        <div className="font-semibold text-text truncate">
                          {col.render
                            ? col.render(row, index)
                            : String((row as Record<string, unknown>)[col.key] ?? '')}
                        </div>
                      ) : (
                        <>
                          <span className="text-[11px] text-text-subtle uppercase tracking-wider shrink-0">
                            {typeof col.header === 'string' ? col.header : col.key}:
                          </span>
                          <span className="text-text-muted truncate tabular-nums text-right">
                            {col.render
                              ? col.render(row, index)
                              : String((row as Record<string, unknown>)[col.key] ?? '')}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="shrink-0 p-1 text-text-subtle">
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================================================
            2. TABLET & DESKTOP (>= 640px): Horizontal Scroll with Sticky First Column
            ======================================================== */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse tabular-nums">
            <thead>
              <tr className="border-b border-border bg-surface-subtle/80 text-text-muted font-medium text-[11px] uppercase tracking-wider">
                {columns.map((col, colIdx) => {
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';
                  const isFirst = colIdx === 0;

                  return (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      className={`px-3.5 py-2.5 ${alignClass} ${col.className || ''} ${
                        isFirst ? 'sticky left-0 bg-surface-subtle z-10 border-r border-border' : ''
                      }`}
                    >
                      {col.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((col, colIdx) => (
                      <td
                        key={col.key}
                        className={`px-3.5 py-3 ${
                          colIdx === 0 ? 'sticky left-0 bg-surface z-10 border-r border-border' : ''
                        }`}
                      >
                        <div className="h-3.5 bg-surface-muted rounded-[4px] w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-xs text-text-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={keyExtractor(row, index)}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors text-text ${
                      onRowClick ? 'cursor-pointer hover:bg-surface-subtle' : 'hover:bg-surface-subtle/50'
                    }`}
                  >
                    {columns.map((col, colIdx) => {
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';
                      const isFirst = colIdx === 0;

                      return (
                        <td
                          key={col.key}
                          className={`px-3.5 py-2.5 text-xs ${alignClass} ${col.className || ''} ${
                            isFirst ? 'sticky left-0 bg-surface z-10 border-r border-border' : ''
                          }`}
                        >
                          {col.render
                            ? col.render(row, index)
                            : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Record Details Bottom Sheet */}
      {selectedRow && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
            onClick={() => setSelectedRow(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full bg-surface border-t border-border rounded-t-[16px] shadow-2xl max-h-[85dvh] flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-serif text-base font-medium text-text">Record Details</h3>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="p-1 text-text-muted hover:text-text rounded-[4px] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close details"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              {columns.map(col => (
                <div key={col.key} className="flex flex-col gap-0.5 border-b border-border/60 pb-2">
                  <span className="text-[10px] uppercase font-semibold text-text-subtle tracking-wider">
                    {typeof col.header === 'string' ? col.header : col.key}
                  </span>
                  <div className="text-text font-medium break-words tabular-nums">
                    {col.render
                      ? col.render(selectedRow, 0)
                      : String((selectedRow as Record<string, unknown>)[col.key] ?? '—')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
