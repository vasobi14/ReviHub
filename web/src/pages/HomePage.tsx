import { BookOpen, CircleStar, Film, Gamepad2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Pagination } from '../components/Pagination';
import WorkCard from '../components/WorkCard';
import { useAuth } from '../context/AuthContext';
import { useWorks } from '../hooks/useWorks';

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get('type') ?? 'all';
  const searchQuery = searchParams.get('q')?.trim() ?? '';
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [titleFilter, setTitleFilter] = useState(searchQuery);

  const CATEGORIES = [
    { value: 'all', label: 'EVERYTHING', icon: CircleStar },
    { value: 'movie', label: 'MOVIES', icon: Film },
    { value: 'game', label: 'GAMES', icon: Gamepad2 },
    { value: 'book', label: 'BOOKS', icon: BookOpen },
  ];

  const handleTypeFilterChange = (newType: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (newType === 'all') next.delete('type');
        else next.set('type', newType);
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    setTitleFilter(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const query = titleFilter.trim();
    if (query === searchQuery) return;

    const timeout = setTimeout(() => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (query) next.set('q', query);
          else next.delete('q');
          next.delete('page');
          return next;
        },
        { replace: true }
      );
    }, 250);
    return () => clearTimeout(timeout);
  }, [titleFilter, searchQuery, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (newPage === 1) next.delete('page');
        else next.set('page', String(newPage));
        return next;
      },
      { replace: true }
    );
  };

  const { works, total, totalPages, currentPage, error, mutate, isLoading } =
    useWorks(typeFilter, searchQuery, page);

  const canEdit = !!user?.id;

  const hasFilters = typeFilter !== 'all' || searchQuery !== '';

  return (
    <main>
      <Header />
      <section className="page-section filter-section">
        <div className="filter-buttons">
          {CATEGORIES.map((t) => {
            const ButtonIcon = t.icon;

            return (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTypeFilterChange(t.value)}
                className={`filter-button ${t.value === typeFilter ? 'filter-button-active' : ''}`}
              >
                {ButtonIcon && <ButtonIcon size={20} className="icon-class" />}
                <span> {t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="filter-search">
          <input
            id="search"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            placeholder="Search by name..."
            className="search"
          />
          <span className="filter-count">
            Works matched filter: {total ? total : 0}{' '}
          </span>
          {canEdit && (
            <Link to="/works/new" className="button-link">
              Add a new work
            </Link>
          )}
        </div>
      </section>

      <section>
        {error && (
          <p>
            Failed to load: {error.message}{' '}
            <button type="button" onClick={() => mutate()}>
              Retry
            </button>
          </p>
        )}

        {!error && isLoading && <div>Loading...</div>}

        {!error &&
          !isLoading &&
          works.length === 0 &&
          (hasFilters ? (
            <p>Nothing matches your search.</p>
          ) : (
            <p>
              No works yet.{' '}
              {canEdit && <Link to="/works/new">Add the first one →</Link>}
            </p>
          ))}
        <ul className="work-list">
          {works.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onReviewsChanged={() => mutate()}
            />
          ))}
        </ul>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          disabled={isLoading}
        />
      </section>
    </main>
  );
}
