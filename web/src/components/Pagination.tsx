interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

type PageItem =
  | { type: 'page'; value: number }
  | { type: 'ellipsis'; id: 'start' | 'end' };

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav className="pagination">
      {pages.map((item) =>
        item.type === 'page' ? (
          <button
            type="button"
            key={`page-${item.value}`}
            onClick={() => onPageChange(item.value)}
            disabled={item.value === page || disabled}
            className={item.value === page ? 'pagination-active' : undefined}
          >
            {item.value}
          </button>
        ) : (
          <span key={`ellipsis-${item.id}`}>…</span>
        )
      )}
    </nav>
  );
}

function getPageNumbers(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      type: 'page' as const,
      value: i + 1,
    }));
  }

  const pages: PageItem[] = [{ type: 'page', value: 1 }];

  if (current > 3) pages.push({ type: 'ellipsis', id: 'start' });

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push({ type: 'page', value: i });
  }

  if (current < total - 2) pages.push({ type: 'ellipsis', id: 'end' });
  pages.push({ type: 'page', value: total });

  return pages;
}
