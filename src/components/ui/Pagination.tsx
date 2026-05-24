import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const delta = 2;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center justify-center gap-2 pt-6 pb-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          "p-2 rounded-xl transition-all border",
          currentPage <= 1
            ? "border-slate-100 text-slate-300 cursor-not-allowed"
            : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
        )}
      >
        <ChevronLeft size={18} />
      </button>

      {pages.map((page, idx) => (
        typeof page === 'string' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-slate-300 text-sm">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "min-w-[40px] h-10 rounded-xl text-xs font-bold transition-all",
              currentPage === page
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200"
            )}
          >
            {page}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          "p-2 rounded-xl transition-all border",
          currentPage >= totalPages
            ? "border-slate-100 text-slate-300 cursor-not-allowed"
            : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
        )}
      >
        <ChevronRight size={18} />
      </button>

      <span className="text-[10px] text-slate-400 ml-2 font-medium">
        {currentPage} / {totalPages}
      </span>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [items.length, totalPages]);

  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    currentPage,
    totalPages,
    setCurrentPage,
    paginatedItems,
  };
}

