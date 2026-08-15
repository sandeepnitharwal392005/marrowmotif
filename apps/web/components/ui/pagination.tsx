import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = meta;
  const startCount = (page - 1) * limit + 1;
  const endCount = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#EAE6DF] bg-white rounded-b-xl">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="relative inline-flex items-center rounded-md border border-[#EAE6DF] bg-white px-4 py-2 text-sm font-medium text-[#666666] hover:bg-[#FAF9F6] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-[#EAE6DF] bg-white px-4 py-2 text-sm font-medium text-[#666666] hover:bg-[#FAF9F6] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#666666]">
            Showing <span className="font-medium text-[#1A1A1A]">{startCount}</span> to <span className="font-medium text-[#1A1A1A]">{endCount}</span> of{' '}
            <span className="font-medium text-[#1A1A1A]">{total}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#999999] ring-1 ring-inset ring-[#EAE6DF] hover:bg-[#FAF9F6] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              const isCurrent = p === page;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-[#EAE6DF] focus:z-20 focus:outline-offset-0 ${
                    isCurrent ? 'bg-[#FAF9F6] text-[#1A1A1A] z-10' : 'text-[#666666] hover:bg-[#FAF9F6]'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#999999] ring-1 ring-inset ring-[#EAE6DF] hover:bg-[#FAF9F6] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
